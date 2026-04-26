"""
Analytics Views.

Seller dashboard stats, revenue breakdown, top products.
Admin platform-wide analytics.
"""

from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsAdminOrModerator, IsApprovedSeller

from .models import SearchLog, SellerDashboardStats
from .serializers import SellerDashboardStatsSerializer


# ═══════════════════════════════════════════════════════════════════
# SELLER ANALYTICS
# ═══════════════════════════════════════════════════════════════════

class SellerOverviewView(APIView):
    """GET /api/v1/analytics/seller/overview/"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]

    def get(self, request):
        from apps.orders.models import Order, OrderItem
        from apps.wallet.models import WalletTransaction

        seller = request.user.seller_profile
        store = seller.store

        # Get or create stats
        stats, _ = SellerDashboardStats.objects.get_or_create(seller=seller)

        # Revenue chart: last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        daily_revenue = (
            Order.objects.filter(
                store=store, payment_status='paid',
                created_at__gte=thirty_days_ago,
            )
            .extra(select={'day': "DATE(created_at)"})
            .values('day')
            .annotate(revenue=Sum('total_amount'), count=Count('id'))
            .order_by('day')
        )

        # Order status breakdown
        status_breakdown = (
            Order.objects.filter(store=store)
            .values('status')
            .annotate(count=Count('id'))
        )

        # Top 5 products by sold count
        top_products = (
            OrderItem.objects.filter(
                order__store=store, order__payment_status='paid',
            )
            .values('product__name', 'product__id')
            .annotate(
                sold=Sum('quantity'),
                revenue=Sum('total_price'),
            )
            .order_by('-sold')[:5]
        )

        # Recent transactions
        try:
            wallet = seller.wallet
            recent_txns = WalletTransaction.objects.filter(
                wallet=wallet,
            ).order_by('-created_at')[:10]
            txn_data = [
                {
                    'type': t.transaction_type,
                    'amount': str(t.amount),
                    'description': t.description,
                    'created_at': t.created_at,
                }
                for t in recent_txns
            ]
        except Exception:
            txn_data = []

        return Response({
            'success': True,
            'data': {
                'stats': SellerDashboardStatsSerializer(stats).data,
                'revenue_chart': list(daily_revenue),
                'status_breakdown': list(status_breakdown),
                'top_products': list(top_products),
                'recent_transactions': txn_data,
            },
        })


class SellerRevenueView(APIView):
    """GET /api/v1/analytics/seller/revenue/?period=30d|7d|90d"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]

    def get(self, request):
        from apps.orders.models import Order

        store = request.user.seller_profile.store
        period = request.query_params.get('period', '30d')
        days = {'7d': 7, '30d': 30, '90d': 90}.get(period, 30)
        since = timezone.now() - timedelta(days=days)

        daily = (
            Order.objects.filter(
                store=store, payment_status='paid',
                created_at__gte=since,
            )
            .extra(select={'day': "DATE(created_at)"})
            .values('day')
            .annotate(revenue=Sum('total_amount'), orders=Count('id'))
            .order_by('day')
        )

        return Response({
            'success': True,
            'data': {
                'period': period,
                'daily_revenue': list(daily),
            },
        })


class SellerTopProductsView(APIView):
    """GET /api/v1/analytics/seller/products/top/"""

    permission_classes = [IsAuthenticated, IsApprovedSeller]

    def get(self, request):
        from apps.orders.models import OrderItem

        store = request.user.seller_profile.store
        top_products = (
            OrderItem.objects.filter(
                order__store=store, order__payment_status='paid',
            )
            .values('product__id', 'product__name', 'product__slug')
            .annotate(
                sold_count=Sum('quantity'),
                total_revenue=Sum('total_price'),
            )
            .order_by('-sold_count')[:10]
        )

        return Response({
            'success': True,
            'data': list(top_products),
        })


# ═══════════════════════════════════════════════════════════════════
# ADMIN PLATFORM ANALYTICS
# ═══════════════════════════════════════════════════════════════════

class AdminPlatformAnalyticsView(APIView):
    """GET /api/v1/admin/analytics/platform/"""

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def get(self, request):
        from apps.authentication.models import User
        from apps.mall.models import StoreProduct
        from apps.marketplace.models import MarketplaceProduct
        from apps.orders.models import Order, OrderItem

        now = timezone.now()
        today = now.date()
        seven_days_ago = now - timedelta(days=7)
        thirty_days_ago = now - timedelta(days=30)

        # GMV (Gross Merchandise Value)
        gmv_today = Order.objects.filter(
            created_at__date=today, payment_status='paid',
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')

        gmv_7d = Order.objects.filter(
            created_at__gte=seven_days_ago, payment_status='paid',
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')

        gmv_30d = Order.objects.filter(
            created_at__gte=thirty_days_ago, payment_status='paid',
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')

        # New users
        new_users_today = User.objects.filter(date_joined__date=today).count()
        new_users_7d = User.objects.filter(date_joined__gte=seven_days_ago).count()

        # Active listings
        active_mall = StoreProduct.objects.filter(is_active=True).count()
        active_marketplace = MarketplaceProduct.objects.filter(
            status='approved',
        ).count()

        # Top selling products (platform-wide)
        top_selling = (
            OrderItem.objects.filter(order__payment_status='paid')
            .values('product__id', 'product__name')
            .annotate(sold=Sum('quantity'), revenue=Sum('total_price'))
            .order_by('-sold')[:10]
        )

        # Revenue by campus
        revenue_by_campus = (
            Order.objects.filter(payment_status='paid')
            .values('buyer__university__name')
            .annotate(total=Sum('total_amount'), orders=Count('id'))
            .order_by('-total')[:10]
        )

        # Top search queries (unfulfilled: result_count=0)
        top_unfulfilled = (
            SearchLog.objects.filter(result_count=0)
            .values('query')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )

        # Platform commission today
        commission_today = (
            OrderItem.objects.filter(
                order__created_at__date=today,
                order__payment_status='paid',
            ).aggregate(total=Sum('commission_amount'))['total']
            or Decimal('0')
        )

        return Response({
            'success': True,
            'data': {
                'gmv_today': gmv_today,
                'gmv_7d': gmv_7d,
                'gmv_30d': gmv_30d,
                'new_users_today': new_users_today,
                'new_users_7d': new_users_7d,
                'active_listings_count': active_mall + active_marketplace,
                'top_selling_products': list(top_selling),
                'revenue_by_campus': list(revenue_by_campus),
                'top_unfulfilled_searches': list(top_unfulfilled),
                'platform_commission_today': commission_today,
            },
        })


class AdminRevenueChartView(APIView):
    """GET /api/v1/admin/analytics/revenue/?period=10d|1m"""

    permission_classes = [IsAuthenticated, IsAdminOrModerator]

    def get(self, request):
        from apps.orders.models import Order
        from datetime import date as date_type

        period = request.query_params.get('period', '10d')
        days = {'10d': 10, '1m': 30}.get(period, 10)
        since = timezone.now() - timedelta(days=days)

        daily = (
            Order.objects.filter(payment_status='paid', created_at__gte=since)
            .extra(select={'day': "DATE(created_at)"})
            .values('day')
            .annotate(revenue=Sum('total_amount'))
            .order_by('day')
        )

        # Build a full date range with 0 as default so chart has no gaps
        date_map = {}
        for i in range(days):
            d = (timezone.now() - timedelta(days=days - 1 - i)).date()
            date_map[str(d)] = 0

        for row in daily:
            key = str(row['day'])
            if key in date_map:
                date_map[key] = float(row['revenue'] or 0)

        labels = []
        data = []
        for date_str, amount in date_map.items():
            d = date_type.fromisoformat(date_str)
            labels.append(d.strftime('%b %d'))
            data.append(amount)

        return Response({
            'success': True,
            'data': {
                'labels': labels,
                'data': data,
            },
        })
