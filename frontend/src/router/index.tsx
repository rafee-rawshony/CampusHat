import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { ProtectedRoute } from '@/components/guards/ProtectedRoute'
import { RoleRoute } from '@/components/guards/RoleRoute'

// Layouts
import { RootLayout } from '@/layouts/RootLayout'
import { AccountLayout } from '@/layouts/AccountLayout'
import { SellerLayout } from '@/layouts/SellerLayout'
import { AdminLayout } from '@/layouts/AdminLayout'

// Mall Pages
import MallHomePage from '@/pages/mall/MallHomePage'
import ShopPage from '@/pages/mall/ShopPage'
import CategoryPage from '@/pages/mall/CategoryPage'
import ProductDetailPage from '@/pages/mall/ProductDetailPage'
import SellersPage from '@/pages/mall/SellersPage'
import StoreDetailPage from '@/pages/mall/StoreDetailPage'
import CheckoutPage from '@/pages/mall/CheckoutPage'
import OrdersPage from '@/pages/mall/OrdersPage'
import OrderDetailPage from '@/pages/mall/OrderDetailPage'

// Marketplace Pages
import MarketplacePage from '@/pages/marketplace/MarketplacePage'
import ExplorerPage from '@/pages/marketplace/ExplorerPage'
import ListingsPage from '@/pages/marketplace/ListingsPage'
import AdDetailPage from '@/pages/marketplace/AdDetailPage'
import PostAdPage from '@/pages/marketplace/PostAdPage'
import MyAdsPage from '@/pages/marketplace/MyAdsPage'
import ChatPage from '@/pages/marketplace/ChatPage'
import ChatWindowPage from '@/pages/marketplace/ChatWindowPage'

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage'
import SellerRegisterPage from '@/pages/auth/SellerRegisterPage'

// Account Pages
import AccountPage from '@/pages/account/AccountPage'
import AccountOrdersPage from '@/pages/account/AccountOrdersPage'
import AccountListingsPage from '@/pages/account/AccountListingsPage'
import VerifyPage from '@/pages/account/VerifyPage'

// Seller Pages
import SellerApplyPage from '@/pages/seller/SellerApplyPage'
import SellerDashboardPage from '@/pages/seller/SellerDashboardPage'
import SellerProductsPage from '@/pages/seller/SellerProductsPage'
import SellerOrdersPage from '@/pages/seller/SellerOrdersPage'
import SellerWalletPage from '@/pages/seller/SellerWalletPage'
import SellerMessagesPage from '@/pages/seller/SellerMessagesPage'
import SellerSettingsPage from '@/pages/seller/SellerSettingsPage'

// Admin Pages
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminApprovalsPage from '@/pages/admin/AdminApprovalsPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminCampusesPage from '@/pages/admin/AdminCampusesPage'
import AdminCategoriesPage from '@/pages/admin/AdminCategoriesPage'
import AdminActivityPage from '@/pages/admin/AdminActivityPage'

// Utility Pages
import UnauthorizedPage from '@/pages/UnauthorizedPage'
import OfflinePage from '@/pages/OfflinePage'
import NotFoundPage from '@/pages/NotFoundPage'

function SellerGuard({ children }: { children: React.ReactNode }) {
  const { isSeller, isAdmin } = useAuthStore()
  return <RoleRoute allowed={() => isSeller() || isAdmin()} fallback="/seller/apply">{children}</RoleRoute>
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, isModerator } = useAuthStore()
  return <RoleRoute allowed={() => isAdmin() || isModerator()} fallback="/unauthorized">{children}</RoleRoute>
}

export const router = createBrowserRouter([{
  path: '/',
  element: <RootLayout />,
  children: [
    // Public mall routes
    { index: true, element: <MallHomePage /> },
    { path: 'categories', element: <CategoryPage /> },
    { path: 'categories/:slug', element: <CategoryPage /> },
    { path: 'shop', element: <ShopPage /> },
    { path: 'products/:slug', element: <ProductDetailPage /> },
    { path: 'sellers', element: <SellersPage /> },
    { path: 'sellers/:slug', element: <StoreDetailPage /> },

    // Protected mall
    { path: 'checkout', element: <ProtectedRoute><CheckoutPage /></ProtectedRoute> },
    { path: 'orders', element: <ProtectedRoute><OrdersPage /></ProtectedRoute> },
    { path: 'orders/:id', element: <ProtectedRoute><OrderDetailPage /></ProtectedRoute> },

    // Marketplace
    { path: 'marketplace', element: <MarketplacePage /> },
    { path: 'marketplace/explorer', element: <ExplorerPage /> },
    { path: 'marketplace/:type', element: <ListingsPage /> },
    { path: 'marketplace/listings/:id', element: <AdDetailPage /> },
    { path: 'marketplace/post', element: <ProtectedRoute><PostAdPage /></ProtectedRoute> },
    { path: 'marketplace/my-ads', element: <ProtectedRoute><MyAdsPage /></ProtectedRoute> },
    { path: 'marketplace/chat', element: <ProtectedRoute><ChatPage /></ProtectedRoute> },
    { path: 'marketplace/chat/:id', element: <ProtectedRoute><ChatWindowPage /></ProtectedRoute> },

    // Auth
    { path: 'auth/login', element: <LoginPage /> },
    { path: 'auth/register', element: <RegisterPage /> },
    { path: 'auth/verify-email', element: <VerifyEmailPage /> },
    { path: 'seller/register', element: <SellerRegisterPage /> },

    // Account (nested)
    {
      path: 'account',
      element: <ProtectedRoute><AccountLayout /></ProtectedRoute>,
      children: [
        { index: true, element: <AccountPage /> },
        { path: 'orders', element: <AccountOrdersPage /> },
        { path: 'listings', element: <AccountListingsPage /> },
        { path: 'verify', element: <VerifyPage /> },
      ],
    },

    // Seller
    { path: 'seller/apply', element: <ProtectedRoute><SellerApplyPage /></ProtectedRoute> },
    {
      path: 'seller',
      element: <SellerGuard><SellerLayout /></SellerGuard>,
      children: [
        { index: true, element: <SellerDashboardPage /> },
        { path: 'products', element: <SellerProductsPage /> },
        { path: 'orders', element: <SellerOrdersPage /> },
        { path: 'wallet', element: <SellerWalletPage /> },
        { path: 'messages', element: <SellerMessagesPage /> },
        { path: 'settings', element: <SellerSettingsPage /> },
      ],
    },

    // Admin
    {
      path: 'admin',
      element: <AdminGuard><AdminLayout /></AdminGuard>,
      children: [
        { index: true, element: <AdminDashboardPage /> },
        { path: 'approvals', element: <AdminApprovalsPage /> },
        { path: 'users', element: <AdminUsersPage /> },
        { path: 'campuses', element: <AdminCampusesPage /> },
        { path: 'categories', element: <AdminCategoriesPage /> },
        { path: 'activity', element: <AdminActivityPage /> },
      ],
    },

    // Utility
    { path: 'unauthorized', element: <UnauthorizedPage /> },
    { path: 'offline', element: <OfflinePage /> },
    { path: '*', element: <NotFoundPage /> },
  ],
}])

export function AppRouter() {
  return <RouterProvider router={router} />
}
