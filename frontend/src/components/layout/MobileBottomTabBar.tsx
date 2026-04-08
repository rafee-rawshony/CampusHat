import { NavLink } from 'react-router-dom'
import { Home, Search, ShoppingBag, MessageCircle, User } from 'lucide-react'
import { useModeStore } from '@/stores/mode.store'
import { useAuthStore } from '@/stores/auth.store'

export function MobileBottomTabBar() {
  const { mode } = useModeStore()
  const { isAuthenticated } = useAuthStore()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-0.5 text-[10px] font-semibold transition-colors ${isActive ? 'text-brand-primary' : 'text-gray-400'}`

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-surface-border z-50 bottom-nav">
      <div className="flex items-center justify-around py-1.5">
        <NavLink to="/" end className={linkClass}>
          <Home size={20} />
          <span>Home</span>
        </NavLink>
        <NavLink to={mode === 'mall' ? '/shop' : '/marketplace'} className={linkClass}>
          <Search size={20} />
          <span>Explore</span>
        </NavLink>
        {isAuthenticated && (
          <NavLink to="/cart" className={linkClass}>
            <ShoppingBag size={20} />
            <span>Cart</span>
          </NavLink>
        )}
        {isAuthenticated && (
          <NavLink to="/marketplace/chat" className={linkClass}>
            <MessageCircle size={20} />
            <span>Chat</span>
          </NavLink>
        )}
        <NavLink to={isAuthenticated ? '/account' : '/auth/login'} className={linkClass}>
          <User size={20} />
          <span>Account</span>
        </NavLink>
      </div>
    </nav>
  )
}
