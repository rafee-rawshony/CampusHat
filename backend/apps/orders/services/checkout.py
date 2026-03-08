"""
Checkout Service.

Atomic checkout flow:
  1. Validate cart
  2. Lock + check stock
  3. Calculate totals + commission
  4. Debit buyer wallet (if wallet payment)
  5. Create order + items
  6. Deduct stock (F-expression)
  7. Credit seller + platform wallets
  8. Clear cart
  9. Create initial status history
  10. Queue async tasks (invoice, emails)
"""

from decimal import Decimal

from django.db import transaction
from django.db.models import F
from django.utils import timezone

from apps.mall.models import CartItem, ProductVariant, StoreProduct
from apps.orders.models import (
    InvalidStatusTransitionError,
    Invoice,
    Order,
    OrderItem,
    OrderStatusHistory,
)
from apps.sellers.models import StudentBenefit
from apps.wallet.models import Wallet
from core.utils import generate_invoice_number, generate_order_number
from core.wallet_engine import InsufficientBalanceError, create_wallet_transaction


class InsufficientStockError(Exception):
    """Raised when a product doesn't have enough stock."""
    pass


class CheckoutError(Exception):
    """General checkout failure."""
    pass


def process_checkout(user, cart, delivery_address_id, payment_method,
                     buyer_note=None, delivery_address_snapshot=None):
    """
    Process a full atomic checkout.

    Args:
        user: Authenticated buyer.
        cart: Cart instance with items.
        delivery_address_id: UUID of the delivery address.
        payment_method: 'wallet', 'bkash', 'nagad', 'rocket', 'card', 'cod'.
        buyer_note: Optional note from buyer.
        delivery_address_snapshot: Dict snapshot of address.

    Returns:
        Created Order instance.

    Raises:
        CheckoutError: If cart is empty or other validation fails.
        InsufficientStockError: If any item is out of stock.
        InsufficientBalanceError: If wallet balance is insufficient.
    """
    with transaction.atomic():

        # 1. VALIDATE cart not empty
        cart_items = list(cart.items.select_related(
            'product', 'product__store', 'product__store__seller',
            'variant',
        ).all())

        if not cart_items:
            raise CheckoutError('Cart is empty.')

        # 2. LOCK all products for stock check
        product_ids = [item.product_id for item in cart_items]
        products_qs = StoreProduct.objects.select_for_update().filter(
            id__in=product_ids,
        )
        products_map = {p.id: p for p in products_qs}

        # Lock variants too
        variant_ids = [
            item.variant_id for item in cart_items if item.variant_id
        ]
        if variant_ids:
            variants_qs = ProductVariant.objects.select_for_update().filter(
                id__in=variant_ids,
            )
            variants_map = {v.id: v for v in variants_qs}
        else:
            variants_map = {}

        # 3. CHECK STOCK
        for item in cart_items:
            if item.variant_id:
                variant = variants_map.get(item.variant_id)
                if not variant or variant.stock_quantity < item.quantity:
                    available = variant.stock_quantity if variant else 0
                    raise InsufficientStockError(
                        f'Insufficient stock for "{item.product.name}" '
                        f'(variant: {item.variant.name if item.variant else "N/A"}). '
                        f'Available: {available}, Requested: {item.quantity}.'
                    )
            else:
                product = products_map.get(item.product_id)
                if not product or product.stock_quantity < item.quantity:
                    available = product.stock_quantity if product else 0
                    raise InsufficientStockError(
                        f'Insufficient stock for "{item.product.name}". '
                        f'Available: {available}, Requested: {item.quantity}.'
                    )

        # 4. CALCULATE TOTALS
        subtotal = sum(
            item.unit_price_snapshot * item.quantity
            for item in cart_items
        )
        discount = Decimal('0.00')  # Full coupon logic in Phase 08
        delivery_fee = Decimal('60.00') if subtotal > 0 else Decimal('0.00')
        total = subtotal - discount + delivery_fee

        # 5. GET SELLER + COMMISSION RATE
        store = cart_items[0].product.store
        seller_profile = store.seller
        commission_rate = seller_profile.commission_rate or Decimal('10.00')

        # Check active StudentBenefit for commission discount
        today = timezone.now().date()
        benefit = StudentBenefit.objects.filter(
            seller=seller_profile,
            benefit_type='commission_discount',
            is_active=True,
            valid_from__lte=today,
            valid_until__gte=today,
        ).first()
        if benefit and hasattr(benefit, 'discount_percentage'):
            commission_rate -= benefit.discount_percentage
        commission_rate = max(commission_rate, Decimal('0.00'))

        # 6. CALCULATE COMMISSION
        commission = (total * commission_rate / 100).quantize(Decimal('0.01'))
        seller_net = total - commission - delivery_fee

        # 7. DEBIT BUYER WALLET (if wallet payment)
        if payment_method == 'wallet':
            buyer_wallet = Wallet.get_or_create_user_wallet(user, 'user')
            create_wallet_transaction(
                wallet=buyer_wallet,
                txn_type='debit',
                amount=total,
                reason='order_payment',
                description=f'Order payment',
                created_by=user,
            )

        # 8. CREATE ORDER
        order = Order.objects.create(
            order_number=generate_order_number(),
            buyer=user,
            store=store,
            delivery_address_id=delivery_address_id,
            delivery_address_snapshot=delivery_address_snapshot or {},
            coupon_code_snapshot=getattr(cart, 'coupon_code', None),
            subtotal=subtotal,
            discount_amount=discount,
            delivery_fee=delivery_fee,
            total_amount=total,
            platform_commission=commission,
            seller_net_amount=seller_net,
            payment_status='paid' if payment_method == 'wallet' else 'pending',
            order_status='placed',
            buyer_note=buyer_note,
        )

        # 9. CREATE ORDER ITEMS
        for item in cart_items:
            item_line_total = item.unit_price_snapshot * item.quantity
            item_commission = (
                item_line_total * commission_rate / 100
            ).quantize(Decimal('0.01'))

            OrderItem.objects.create(
                order=order,
                product=item.product,
                variant=item.variant,
                product_name_snapshot=item.product.name,
                unit_price=item.unit_price_snapshot,
                quantity=item.quantity,
                line_total=item_line_total,
                commission_rate_snapshot=commission_rate,
                commission_amount=item_commission,
            )

        # 10. DEDUCT STOCK (F-expression — atomic)
        for item in cart_items:
            if item.variant_id:
                ProductVariant.objects.filter(pk=item.variant_id).update(
                    stock_quantity=F('stock_quantity') - item.quantity,
                )
            else:
                StoreProduct.objects.filter(pk=item.product_id).update(
                    stock_quantity=F('stock_quantity') - item.quantity,
                )
            # Update sold_count
            StoreProduct.objects.filter(pk=item.product_id).update(
                sold_count=F('sold_count') + item.quantity,
            )

        # 11. CREDIT SELLER + PLATFORM WALLETS (if payment confirmed)
        if order.payment_status == 'paid':
            seller_wallet = Wallet.get_or_create_user_wallet(
                seller_profile.user, 'seller',
            )
            create_wallet_transaction(
                wallet=seller_wallet,
                txn_type='credit',
                amount=seller_net,
                reason='seller_credit',
                reference_type='order',
                reference_id=order.id,
                description=f'Sale from order {order.order_number}',
                created_by=user,
            )

            platform_wallet = Wallet.get_platform_wallet()
            create_wallet_transaction(
                wallet=platform_wallet,
                txn_type='credit',
                amount=commission,
                reason='commission',
                reference_type='order',
                reference_id=order.id,
                description=f'Commission from order {order.order_number}',
            )

        # 12. CLEAR CART
        CartItem.objects.filter(cart=cart).delete()
        cart.coupon_code = None
        cart.save(update_fields=['coupon_code'])

        # 13. CREATE INITIAL STATUS HISTORY
        OrderStatusHistory.objects.create(
            order=order,
            from_status=None,
            to_status='placed',
            changed_by=user,
            changed_by_role='buyer',
        )

        # 14. QUEUE ASYNC TASKS
        try:
            from apps.orders.tasks import (
                generate_invoice_task,
                notify_seller_new_order,
                send_order_confirmation,
            )
            generate_invoice_task.delay(str(order.id))
            send_order_confirmation.delay(str(order.id))
            notify_seller_new_order.delay(str(order.id))
        except Exception:
            pass  # Don't block checkout if Celery is down

    return order
