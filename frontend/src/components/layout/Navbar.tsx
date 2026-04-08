import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { useModeStore } from '@/stores/mode.store'
import { useCartStore } from '@/stores/cart.store'
import { Search, User, Heart, ShoppingBag, PlusCircle, Building2, ChevronDown, Compass, ShoppingCart, Key, Briefcase, UtensilsCrossed } from 'lucide-react'

export function Navbar() {
  const { isAuthenticated, user } = useAuthStore()
  const { mode, setMode } = useModeStore()
  const { items, setIsOpen } = useCartStore()
  const navigate = useNavigate()

  return (
    <header className="hidden sm:block">
      {/* ─── Row 1: Top Banner ─── */}
      <div className="bg-gradient-to-r from-brand-primary to-[#7c5fc4] text-white text-sm py-2">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center relative">
          <span className="font-medium tracking-wide">
            {mode === 'mall' ? 'CampusHat Mall' : 'Welcome to CampusHat Marketplace'}
          </span>
          {mode === 'marketplace' && (
            <button className="absolute right-4 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors">
              <Building2 size={13} /> Switch Campus <ChevronDown size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ─── Row 2: Main Header (Sticky) ─── */}
      <div className="bg-white sticky top-0 z-50 border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16 gap-6">
          {/* Left: Logo + Toggle */}
          <div className="flex items-center gap-4 shrink-0">
            <Link to="/" className="flex items-center">
              <span className="text-2xl md:text-3xl font-extrabold">
                <span className="text-gray-800">Campus</span>
                <span className="text-brand-primary">Hat</span>
              </span>
            </Link>

            {/* Mall / Marketplace pill toggle */}
            <div className="flex items-center bg-gray-100 rounded-full p-0.5">
              <button
                onClick={() => { setMode('mall'); navigate('/') }}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  mode === 'mall'
                    ? 'bg-white text-brand-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Mall
              </button>
              <button
                onClick={() => { setMode('marketplace'); navigate('/marketplace') }}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  mode === 'marketplace'
                    ? 'bg-white text-brand-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Marketplace
              </button>
            </div>
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for products, categories or brands..."
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary bg-white"
              />
              <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {isAuthenticated ? (
              <>
                <Link to="/account" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-700 hover:text-brand-primary hover:bg-gray-50 transition-colors">
                  <User size={20} strokeWidth={1.5} />
                  <span className="hidden lg:inline font-medium">{user?.full_name?.split(' ')[0] || 'Account'}</span>
                </Link>
                <Link to="/wishlist" className="relative p-2 rounded-lg text-gray-700 hover:text-brand-primary hover:bg-gray-50 transition-colors">
                  <Heart size={20} strokeWidth={1.5} />
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">0</span>
                </Link>
                <button onClick={() => setIsOpen(true)} className="relative p-2 rounded-lg text-gray-700 hover:text-brand-primary hover:bg-gray-50 transition-colors cursor-pointer border-none bg-transparent">
                  <ShoppingBag size={20} strokeWidth={1.5} />
                  <span className="absolute -top-0.5 -right-0.5 bg-brand-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {items.length}
                  </span>
                </button>
              </>
            ) : (
              <>
                <Link to="/auth/login" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-700 hover:text-brand-primary hover:bg-gray-50 transition-colors">
                  <User size={20} strokeWidth={1.5} />
                  <span className="font-medium">Sign In</span>
                </Link>
                <Link to="/wishlist" className="relative p-2 rounded-lg text-gray-700 hover:text-brand-primary hover:bg-gray-50 transition-colors">
                  <Heart size={20} strokeWidth={1.5} />
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">0</span>
                </Link>
                <button onClick={() => setIsOpen(true)} className="relative p-2 rounded-lg text-gray-700 hover:text-brand-primary hover:bg-gray-50 transition-colors cursor-pointer border-none bg-transparent">
                  <ShoppingBag size={20} strokeWidth={1.5} />
                  <span className="absolute -top-0.5 -right-0.5 bg-brand-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {items.length}
                  </span>
                </button>
              </>
            )}
            {mode === 'marketplace' && isAuthenticated && (
              <Link to="/marketplace/post" className="ml-2 flex items-center gap-1.5 bg-brand-primary hover:bg-brand-dark text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
                <PlusCircle size={16} /> Post Ad
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ─── Row 3: Secondary Navigation ─── */}
      <div className="bg-white border-b border-surface-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-1 h-11 -mb-px">
            {mode === 'mall' ? (
              <>
                <NavLink to="/" end className={({ isActive }) => `px-4 py-2 text-sm font-semibold transition-colors rounded-md ${isActive ? 'text-brand-primary' : 'text-gray-600 hover:text-brand-primary'}`}>Home</NavLink>
                <NavLink to="/categories" className={({ isActive }) => `px-4 py-2 text-sm font-semibold transition-colors rounded-md ${isActive ? 'text-brand-primary' : 'text-gray-600 hover:text-brand-primary'}`}>Categories</NavLink>
                <NavLink to="/shop" className={({ isActive }) => `px-4 py-2 text-sm font-semibold transition-colors rounded-md ${isActive ? 'text-brand-primary' : 'text-gray-600 hover:text-brand-primary'}`}>Shop</NavLink>
                <NavLink to="/sellers" className={({ isActive }) => `px-4 py-2 text-sm font-semibold transition-colors rounded-md ${isActive ? 'text-brand-primary' : 'text-gray-600 hover:text-brand-primary'}`}>Sellers</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/marketplace" end className={({ isActive }) => `px-4 py-2 text-sm font-semibold transition-colors rounded-md ${isActive ? 'text-brand-primary' : 'text-gray-600 hover:text-brand-primary'}`}>Home</NavLink>
                <NavLink to="/marketplace/explorer" className={({ isActive }) => `flex items-center gap-1 px-4 py-2 text-sm font-semibold transition-colors rounded-md ${isActive ? 'text-brand-primary' : 'text-gray-600 hover:text-brand-primary'}`}><Compass size={14} /> Explorer</NavLink>
                <NavLink to="/marketplace/buy" className={({ isActive }) => `flex items-center gap-1 px-4 py-2 text-sm font-semibold transition-colors rounded-md ${isActive ? 'text-brand-primary' : 'text-gray-600 hover:text-brand-primary'}`}><ShoppingCart size={14} /> Buy</NavLink>
                <NavLink to="/marketplace/rental" className={({ isActive }) => `flex items-center gap-1 px-4 py-2 text-sm font-semibold transition-colors rounded-md ${isActive ? 'text-brand-primary' : 'text-gray-600 hover:text-brand-primary'}`}><Key size={14} /> Rental</NavLink>
                <NavLink to="/marketplace/services" className={({ isActive }) => `flex items-center gap-1 px-4 py-2 text-sm font-semibold transition-colors rounded-md ${isActive ? 'text-brand-primary' : 'text-gray-600 hover:text-brand-primary'}`}><Briefcase size={14} /> Services</NavLink>
                <NavLink to="/marketplace/food" className={({ isActive }) => `flex items-center gap-1 px-4 py-2 text-sm font-semibold transition-colors rounded-md ${isActive ? 'text-brand-primary' : 'text-gray-600 hover:text-brand-primary'}`}><UtensilsCrossed size={14} /> Food</NavLink>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
