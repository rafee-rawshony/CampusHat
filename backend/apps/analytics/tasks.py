"""Analytics Celery tasks."""

import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)


@shared_task(name='analytics.update_seller_dashboard_stats')
def update_seller_dashboard_stats(seller_id=None):
    """
    Every 6 hours — recompute SellerDashboardStats from source data.
    If seller_id is None, update ALL sellers.
    """
    from apps.analytics.models import SellerDashboardStats
    from apps.orders.models import Order, OrderItem
    from apps.sellers.models import SellerProfile
    from django.db.models import Avg, Sum

    if seller_id:
        sellers = SellerProfile.objects.filter(id=seller_id)
    else:
        sellers = SellerProfile.objects.filter(is_approved=True)

    updated = 0
    for seller in sellers:
        try:
            store = seller.store
        except Exception:
            continue

        paid_orders = Order.objects.filter(
            store=store, payment_status='paid',
        )

        total_revenue = paid_orders.aggregate(
            total=Sum('total_amount'),
        )['total'] or 0

        total_commission = OrderItem.objects.filter(
            order__store=store, order__payment_status='paid',
        ).aggregate(
            total=Sum('commission_amount'),
        )['total'] or 0

        total_orders = Order.objects.filter(store=store).count()
        completed = Order.objects.filter(
            store=store, status='delivered',
        ).count()

        # Pending balance from wallet
        try:
            pending_balance = seller.wallet.balance
        except Exception:
            pending_balance = 0

        # Average rating from product reviews
        from apps.mall.models import ProductReview
        rating_avg = ProductReview.objects.filter(
            product__store=store,
        ).aggregate(avg=Avg('rating'))['avg'] or 0

        SellerDashboardStats.objects.update_or_create(
            seller=seller,
            defaults={
                'total_revenue': total_revenue,
                'total_commission_paid': total_commission,
                'total_orders': total_orders,
                'completed_orders': completed,
                'pending_balance': pending_balance,
                'rating_avg': round(rating_avg, 2),
            },
        )
        updated += 1

    logger.info(f'Updated dashboard stats for {updated} sellers.')


@shared_task(name='analytics.cleanup_old_analytics')
def cleanup_old_analytics(days=90):
    """
    Weekly — delete old ProductView and ActivityLog records.
    WalletTransaction is permanent (financial records).
    """
    from apps.analytics.models import ActivityLog, ProductView

    cutoff_views = timezone.now() - timedelta(days=days)
    cutoff_logs = timezone.now() - timedelta(days=180)

    views_deleted, _ = ProductView.objects.filter(
        viewed_at__lt=cutoff_views,
    ).delete()

    logs_deleted, _ = ActivityLog.objects.filter(
        created_at__lt=cutoff_logs,
    ).delete()

    logger.info(
        f'Cleanup: {views_deleted} ProductViews (>{days}d), '
        f'{logs_deleted} ActivityLogs (>180d) deleted.',
    )
