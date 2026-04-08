import { Outlet, NavLink, Navigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { ApplicationUnderReviewCard } from '@/pages/seller/components/ApplicationUnderReviewCard'
import { LayoutDashboard, Package, ShoppingBag, Wallet, MessageSquare, Settings, LogOut, Store } from 'lucide-react'

// Desktop Sidebar
function SellerSidebar() {
  const { logout } = useAuthStore()
  
  const navItems = [
    { name: 'Dashboard', path: '/seller', icon: LayoutDashboard, exact: true },
    { name: 'Products', path: '/seller/products', icon: Package },
    { name: 'Orders', path: '/seller/orders', icon: ShoppingBag },
    { name: 'Wallet', path: '/seller/wallet', icon: Wallet },
    { name: 'Messages', path: '/seller/messages', icon: MessageSquare },
    { name: 'Settings', path: '/seller/settings', icon: Settings },
  ]

  return (
    <aside className="w-64 bg-white border-r flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
      <div className="h-16 flex items-center px-6 border-b shrink-0">
        <Link to="/" className="font-extrabold text-xl tracking-tight text-gray-900 flex items-center gap-2">
          Campus<span className="text-brand-primary">Hat</span>
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase tracking-wider font-bold ml-1">Seller</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.exact}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
              isActive ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <item.icon size={20} />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

// Mobile Bottom Navbar / Header
function MobileSellerHeader() {
  const navItems = [
    { name: 'Home', path: '/seller', icon: LayoutDashboard, exact: true },
    { name: 'Items', path: '/seller/products', icon: Package },
    { name: 'Orders', path: '/seller/orders', icon: ShoppingBag },
    { name: 'More', path: '/seller/settings', icon: Settings },
  ]

  return (
    <>
      <header className="h-14 bg-white border-b flex items-center px-4 sticky top-0 z-30 shrink-0">
        <Link to="/" className="font-extrabold text-lg tracking-tight text-gray-900 flex items-center gap-2">
          <Store className="text-brand-primary" size={20} /> CampusHat <span className="font-normal text-gray-400">| Seller</span>
        </Link>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex items-center justify-around z-40 pb-[env(safe-area-inset-bottom)]">
        {navItems.map(item => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.exact}
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              isActive ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} className={isActive ? 'fill-brand-primary/20' : ''} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  )
}

// Optional Alerts Side Panel for Desktop
function AlertsPanel() {
  return (
    <aside className="w-72 bg-gray-50 border-l p-6 hidden xl:block sticky top-0 h-screen overflow-y-auto">
      <h3 className="font-bold text-gray-900 mb-4">Quick Alerts</h3>
      <div className="space-y-3">
        <div className="bg-white p-3 rounded-xl border shadow-sm text-sm border-l-4 border-l-orange-500">
          <p className="font-semibold text-gray-900">2 New Orders</p>
          <p className="text-gray-500 text-xs mt-1">Requires your attention to ship.</p>
        </div>
        <div className="bg-white p-3 rounded-xl border shadow-sm text-sm border-l-4 border-l-brand-primary">
          <p className="font-semibold text-gray-900">Payment Processed</p>
          <p className="text-gray-500 text-xs mt-1">৳1,450 deposited to wallet.</p>
        </div>
      </div>
    </aside>
  )
}

export function SellerLayout() {
  const { user, isSeller, isAdmin } = useAuthStore()

  if (!isSeller() && !isAdmin()) {
    if (user?.seller_application_status === 'pending') {
      return <ApplicationUnderReviewCard />
    }
    return <Navigate to='/seller/apply' replace />
  }

  return (
    <div className="bg-[#f8f9fa]">
      {/* Desktop Layout */}
      <div className='hidden sm:flex min-h-screen'>
        <SellerSidebar />
        <main className='flex-1 flex flex-col min-h-screen max-h-screen overflow-y-auto w-full'>
           <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
             <Outlet />
           </div>
        </main>
        <AlertsPanel />
      </div>

      {/* Mobile Layout */}
      <div className='sm:hidden flex flex-col min-h-screen pb-16'>
        <MobileSellerHeader />
        <main className='flex-1 p-4'>
           <Outlet />
        </main>
      </div>
    </div>
  )
}
