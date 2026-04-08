import { useState, useEffect } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api'
import { 
  BarChart3, ClipboardCheck, Store, Grid, ShoppingBag, 
  Users, Building2, Tags, Activity, Menu, X, LogOut 
} from 'lucide-react'

// Simple Native Mobile Sheet
function MobileSheet({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 sm:hidden">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-64 bg-[#1a1b26] text-white flex flex-col animate-in slide-in-from-left duration-200 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white p-2">
          <X size={24} />
        </button>
        {children}
      </div>
    </div>
  )
}

function SidebarContent({ items, onClickMap }: { items: any[], onClickMap?: () => void }) {
  const { logout } = useAuthStore()

  return (
    <>
      <div className="h-16 flex items-center px-6 border-b border-gray-800 shrink-0">
        <Link to="/" onClick={onClickMap} className="font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
          Campus<span className="text-brand-primary">Hat</span>
          <span className="text-[10px] bg-brand-primary/20 text-brand-primary px-2 py-0.5 rounded uppercase tracking-wider font-bold ml-1">Admin</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            onClick={onClickMap}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
              isActive 
                ? 'bg-brand-primary text-white shadow-sm' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <item.Icon size={20} />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-gray-800">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-red-400 hover:bg-red-400/10 w-full transition-colors"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </>
  )
}

export function AdminLayout() {
  const { isAdmin, isModerator, user } = useAuthStore()
  const [, setPermissions] = useState<string[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Admins implicitly have everything, moderators fetch spec
    if (!isAdmin() && isModerator()) {
      api.get('/admin/my-permissions/')
        .then(r => setPermissions(r.data.data.permissions || []))
        .catch(() => setPermissions([]))
    }
  }, [user])

  // Derive granular checks (either implicit admin, global moderator module checks, or granular token)
  // Our system checks both specific granular roles or broader ones from the request outline
  const _isAdmin = isAdmin()
  
  const canSeeParams = {
    analytics: _isAdmin,
    approvals: _isAdmin || isModerator(), // Moderators access approximations, tabs inside filter further
    mall: _isAdmin,
    marketplace: _isAdmin,
    orders: _isAdmin,
    users: _isAdmin,
    campuses: _isAdmin,
    categories: _isAdmin,
    activity: _isAdmin
  }

  const sidebarItems = [
    { label: 'Analytics',         to: '/admin',               Icon: BarChart3,      show: canSeeParams.analytics },
    { label: 'Pending Approvals', to: '/admin/approvals',     Icon: ClipboardCheck, show: canSeeParams.approvals },
    { label: 'Mall Products',     to: '/admin/mall-products', Icon: Store,          show: canSeeParams.mall },
    { label: 'Marketplace',       to: '/admin/marketplace',   Icon: Grid,           show: canSeeParams.marketplace },
    { label: 'Orders',            to: '/admin/orders',        Icon: ShoppingBag,    show: canSeeParams.orders },
    { label: 'User Directory',    to: '/admin/users',         Icon: Users,          show: canSeeParams.users },
    { label: 'Campuses',          to: '/admin/campuses',      Icon: Building2,      show: canSeeParams.campuses },
    { label: 'Categories',        to: '/admin/categories',    Icon: Tags,           show: canSeeParams.categories },
    { label: 'Activity Logs',     to: '/admin/activity',      Icon: Activity,       show: canSeeParams.activity },
  ].filter(item => item.show)

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* Desktop Dark Sidebar */}
      <aside className="hidden sm:flex w-64 flex-col bg-[#1a1b26] text-white shrink-0 sticky top-0 h-screen">
         <SidebarContent items={sidebarItems} />
      </aside>

      {/* Mobile Hamburger Layout overlay */}
      <MobileSheet isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
         <SidebarContent items={sidebarItems} onClickMap={() => setMobileMenuOpen(false)} />
      </MobileSheet>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 max-h-screen overflow-y-auto">
        
        {/* Mobile Header */}
        <header className="sm:hidden h-14 bg-white border-b flex items-center px-4 sticky top-0 z-30 shrink-0 gap-3">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-md">
            <Menu size={20} />
          </button>
          <div className="font-extrabold text-lg tracking-tight text-gray-900 flex items-center gap-1.5">
            <Store className="text-brand-primary" size={18} /> Admin
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

    </div>
  )
}
