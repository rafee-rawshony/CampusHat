import { Outlet, NavLink } from 'react-router-dom'
import { User, ShoppingBag, FileText, ShieldCheck } from 'lucide-react'

function AccountSidebar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
      isActive 
        ? 'bg-brand-primary text-white shadow-sm' 
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`

  return (
    <div className="sticky top-24">
      <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">My Account</h2>
      <nav className="flex flex-col gap-1">
        <NavLink to="/account" end className={linkClass}><User size={18} /> Profile</NavLink>
        <NavLink to="/account/orders" className={linkClass}><ShoppingBag size={18} /> Orders</NavLink>
        <NavLink to="/account/listings" className={linkClass}><FileText size={18} /> My Listings</NavLink>
        <NavLink to="/account/verify" className={linkClass}><ShieldCheck size={18} /> Verification</NavLink>
      </nav>
    </div>
  )
}

export function AccountLayout() {
  const tabs = [
    { label: 'Profile',      to: '/account',          icon: User },
    { label: 'Orders',       to: '/account/orders',   icon: ShoppingBag },
    { label: 'Listings',     to: '/account/listings',  icon: FileText },
    { label: 'Verification', to: '/account/verify',    icon: ShieldCheck },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile horizontal tab bar — sm:hidden */}
      <div className="sm:hidden bg-white border-b sticky top-[56px] z-20 overflow-x-auto no-scrollbar">
        <div className="flex min-w-max">
          {tabs.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/account'}
              className={({ isActive }) =>
                `shrink-0 flex items-center gap-1.5 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`
              }
            >
              <tab.icon size={16} />
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Desktop layout */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-8">
          {/* Desktop sidebar — hidden sm:block */}
          <aside className="hidden sm:block w-64 shrink-0">
            <AccountSidebar />
          </aside>

          {/* Main content outlet */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
