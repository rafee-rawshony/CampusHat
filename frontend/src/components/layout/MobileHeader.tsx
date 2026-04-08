import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { useModeStore } from '@/stores/mode.store'
import { Search, Menu, ShoppingCart, X, GraduationCap } from 'lucide-react'

export function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { isAuthenticated } = useAuthStore()
  const { mode, toggleMode } = useModeStore()
  const navigate = useNavigate()

  return (
    <header className="sm:hidden bg-white border-b border-surface-border sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 h-14">
        <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 rounded-lg tap-scale">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link to="/" className="flex items-center gap-1.5">
          <div className="w-7 h-7 bg-brand-primary rounded-lg flex items-center justify-center">
            <GraduationCap size={16} className="text-white" />
          </div>
          <span className="text-lg font-extrabold text-brand-primary">CampusHat</span>
        </Link>

        <div className="flex items-center gap-1">
          <button onClick={() => setSearchOpen(!searchOpen)} className="p-1.5 rounded-lg tap-scale">
            <Search size={20} className="text-gray-600" />
          </button>
          {isAuthenticated && (
            <Link to="/cart" className="p-1.5 rounded-lg tap-scale relative">
              <ShoppingCart size={20} className="text-gray-600" />
            </Link>
          )}
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="absolute inset-x-0 top-14 bg-white p-4 border-b border-surface-border shadow-lg z-50">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2.5 border border-surface-border rounded-xl bg-surface-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigate(`/shop?q=${(e.target as HTMLInputElement).value}`)
                  setSearchOpen(false)
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 top-14 z-50 bg-black/30" onClick={() => setMenuOpen(false)}>
          <div className="w-72 h-full bg-white shadow-xl sheet-enter overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-surface-border">
              <button
                onClick={() => { toggleMode(); setMenuOpen(false) }}
                className="w-full py-2.5 px-4 rounded-xl bg-brand-light text-brand-primary font-semibold text-sm tap-scale"
              >
                {mode === 'mall' ? '🏪 Switch to Marketplace' : '🎓 Switch to Mall'}
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {mode === 'mall' ? (
                <>
                  <Link to="/" className="block py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-surface-muted" onClick={() => setMenuOpen(false)}>Home</Link>
                  <Link to="/shop" className="block py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-surface-muted" onClick={() => setMenuOpen(false)}>Shop</Link>
                  <Link to="/categories" className="block py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-surface-muted" onClick={() => setMenuOpen(false)}>Categories</Link>
                  <Link to="/sellers" className="block py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-surface-muted" onClick={() => setMenuOpen(false)}>Sellers</Link>
                </>
              ) : (
                <>
                  <Link to="/marketplace" className="block py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-surface-muted" onClick={() => setMenuOpen(false)}>Home</Link>
                  <Link to="/marketplace/buy" className="block py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-surface-muted" onClick={() => setMenuOpen(false)}>Buy/Sell</Link>
                  <Link to="/marketplace/rental" className="block py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-surface-muted" onClick={() => setMenuOpen(false)}>Rentals</Link>
                  <Link to="/marketplace/services" className="block py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-surface-muted" onClick={() => setMenuOpen(false)}>Services</Link>
                  <Link to="/marketplace/food" className="block py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-surface-muted" onClick={() => setMenuOpen(false)}>Food</Link>
                </>
              )}
              <div className="border-t border-surface-border my-3" />
              {isAuthenticated ? (
                <>
                  <Link to="/account" className="block py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-surface-muted" onClick={() => setMenuOpen(false)}>My Account</Link>
                  <Link to="/account/orders" className="block py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-surface-muted" onClick={() => setMenuOpen(false)}>My Orders</Link>
                </>
              ) : (
                <Link to="/auth/login" className="block py-2.5 px-3 rounded-lg text-sm font-semibold text-brand-primary hover:bg-brand-light" onClick={() => setMenuOpen(false)}>Sign In</Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
