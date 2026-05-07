"""
Mall Signals.

1. ProductVariant post_save → update parent product stock_quantity
2. ProductReview post_save → recalculate parent product rating_avg + review_count
"""

from django.db.models import Avg, Sum
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import ProductReview, ProductVariant


# =============================================================================
# VARIANT → PRODUCT STOCK SYNC
# =============================================================================

@receiver(post_save, sender=ProductVariant)
def update_product_stock_on_variant_save(sender, instance, **kwargs):
    """
    When a variant is saved, recalculate the parent's stock_quantity
    as the sum of all active variants' stock.
    """
    product = instance.product
    if product.has_variants:
        total = (
            ProductVariant.objects.filter(
                product=product,
                is_active=True,
                deleted_at__isnull=True,
            ).aggregate(total=Sum('stock_quantity'))['total'] or 0
        )
        product.stock_quantity = total
        product.save(update_fields=['stock_quantity'])


@receiver(post_delete, sender=ProductVariant)
def update_product_stock_on_variant_delete(sender, instance, **kwargs):
    """Recalculate stock when a variant is hard-deleted."""
    try:
        product = instance.product
    except Exception:
        return
    if product.has_variants:
        total = (
            ProductVariant.objects.filter(
                product=product,
                is_active=True,
                deleted_at__isnull=True,
            ).aggregate(total=Sum('stock_quantity'))['total'] or 0
        )
        product.stock_quantity = total
        product.save(update_fields=['stock_quantity'])


# =============================================================================
# REVIEW → PRODUCT RATING RECALCULATION
# =============================================================================

@receiver(post_save, sender=ProductReview)
def recalculate_product_rating(sender, instance, **kwargs):
    """
    When a review is saved, recalculate the product's rating_avg
    and review_count using aggregation.
    """
    product = instance.product
    stats = ProductReview.objects.filter(
        product=product,
        is_visible=True,
        deleted_at__isnull=True,
    ).aggregate(
        avg_rating=Avg('rating'),
        total_reviews=Sum('rating', default=0),
    )

    product.rating_avg = round(stats['avg_rating'] or 0, 2)
    product.review_count = ProductReview.objects.filter(
        product=product,
        is_visible=True,
        deleted_at__isnull=True,
    ).count()
    product.save(update_fields=['rating_avg', 'review_count'])
