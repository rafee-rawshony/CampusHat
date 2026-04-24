"""Mall admin registration."""

from django.contrib import admin

from .models import (
    Banner,
    Brand,
    Cart,
    CartItem,
    MallCategory,
    ProductReview,
    ProductVariant,
    StoreProduct,
    StoreProductImage,
    Wishlist,
)


class StoreProductImageInline(admin.TabularInline):
    model = StoreProductImage
    extra = 0


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    list_filter = ('is_active',)


@admin.register(MallCategory)
class MallCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'level', 'parent', 'sort_order', 'is_active')
    list_filter = ('level', 'is_active')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(StoreProduct)
class StoreProductAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'store', 'base_price', 'discount_price',
        'stock_quantity', 'is_active', 'is_featured',
    )
    list_filter = ('is_active', 'is_featured', 'has_variants')
    search_fields = ('name', 'sku', 'slug')
    inlines = [StoreProductImageInline, ProductVariantInline]


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'reviewer', 'rating', 'is_visible', 'created_at')
    list_filter = ('rating', 'is_visible')


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at')
    inlines = [CartItemInline]


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'product__name')
    raw_id_fields = ('user', 'product')


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'ordering', 'created_at')
    list_filter = ('is_active',)
    list_editable = ('is_active', 'ordering')
    search_fields = ('title', 'subtitle')
