"""Wallet admin registration."""

from django.contrib import admin

from .models import Payment, Wallet, WalletTransaction


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('owner', 'wallet_type', 'balance', 'locked_balance', 'currency')
    list_filter = ('wallet_type',)
    search_fields = ('owner__email',)
    readonly_fields = ('balance',)


@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = (
        'wallet', 'transaction_type', 'amount', 'reason',
        'balance_before', 'balance_after', 'created_at',
    )
    list_filter = ('transaction_type', 'reason')
    readonly_fields = (
        'wallet', 'transaction_type', 'amount', 'reason',
        'balance_before', 'balance_after', 'reference_type',
        'reference_id', 'description', 'created_by', 'created_at',
    )

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('order', 'method', 'amount', 'status', 'paid_at')
    list_filter = ('method', 'status')
