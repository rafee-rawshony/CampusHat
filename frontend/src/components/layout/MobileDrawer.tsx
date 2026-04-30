'use client'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Menu, Store, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as DialogPrimitive from "@radix-ui/react-dialog"

export function MobileDrawer() {
  const { user, isAuthenticated, _hasHydrated, logout, isSeller } = useAuthStore()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className='sm:hidden p-2 rounded-lg hover:bg-gray-100 flex items-center justify-center'
                aria-label='Open menu'>
          <Menu className='w-6 h-6 text-gray-700' />
        </button>
      </SheetTrigger>
      <SheetContent side='left' className='w-[280px] p-0 flex flex-col justify-start border-r-0'>
        <DialogPrimitive.Title className="sr-only">Menu</DialogPrimitive.Title>

        {/* USER HEADER */}
        <div className='bg-brand-primary p-6'>
          {/* While Zustand hydrates, show a neutral skeleton so Sign In never flickers for logged-in users */}
          {!_hasHydrated ? (
            <div className='space-y-2'>
              <div className='w-14 h-14 rounded-full bg-white/20 animate-pulse' />
              <div className='h-4 w-32 bg-white/20 rounded animate-pulse mt-3' />
            </div>
          ) : isAuthenticated && user ? (
            <div className='text-white'>
              <div className='w-14 h-14 rounded-full bg-white/20
                            flex items-center justify-center
                            font-black text-2xl mb-3 shadow-sm'>
                {user.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <p className='font-black text-lg tracking-tight'>{user.full_name}</p>
              <p className='text-xs opacity-80 font-medium mt-0.5'>{user.university_name || 'University Member'}</p>
            </div>
          ) : (
            <div className='py-2'>
              <p className='text-white font-black text-xl mb-1'>Welcome!</p>
              <p className='text-white/80 text-xs mb-4'>Sign in to manage your account</p>
              <Link href='/auth/login'
                className='bg-white text-brand-primary text-sm font-black
                           px-4 py-2.5 rounded-xl block text-center shadow-sm w-full hover:bg-gray-50 transition-colors'
              >
                Sign In / Register
              </Link>
            </div>
          )}
        </div>

        {/* NAVIGATION */}
        <nav className='p-4 space-y-1 flex-1 overflow-y-auto no-scrollbar'>
          <p className='text-[10px] font-black text-gray-400 uppercase tracking-widest pl-3 mb-2 mt-2'>Mall</p>
          {['/', '/categories', '/shop', '/sellers'].map((href, i) => (
            <Link key={href} href={href}
              className='flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-colors
                         hover:bg-brand-primary/10 hover:text-brand-primary text-gray-700'>
              {['Home','Categories','Shop','Top Sellers'][i]}
            </Link>
          ))}
          {isAuthenticated && (
            isSeller() ? (
              <Link href='/seller'
                className='flex items-center gap-2 mx-3 mt-2 px-3 py-2.5 rounded-xl font-bold
                           bg-[#4C3B8A] text-white text-sm transition-colors hover:bg-[#2D1B69]'>
                <LayoutDashboard className='w-4 h-4' /> Seller Dashboard
              </Link>
            ) : (
              <Link href='/seller/apply'
                className='flex items-center gap-2 mx-3 mt-2 px-3 py-2.5 rounded-xl font-bold
                           bg-[#4C3B8A] text-white text-sm transition-colors hover:bg-[#2D1B69]'>
                <Store className='w-4 h-4' /> Become a Seller
              </Link>
            )
          )}
          <p className='text-[10px] font-black text-gray-400 uppercase tracking-widest pl-3 mt-6 mb-2'>
            Marketplace
          </p>
          {['/marketplace','/marketplace?type=buy',
            '/marketplace?type=rental','/marketplace?type=service',
            '/marketplace?type=food'].map((href,i)=>(
            <Link key={href} href={href}
              className='flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-colors
                         hover:bg-brand-primary/10 hover:text-brand-primary text-gray-700'>
              {['Home','Buy & Sell','Rentals','Services','Food'][i]}
            </Link>
          ))}
          {isAuthenticated && (
            <>
              <div className='my-4 border-t border-gray-100'></div>
              <p className='text-[10px] font-black text-gray-400 uppercase tracking-widest pl-3 mt-4 mb-2'>
                Account
              </p>
              <Link href='/account' className='block px-3 py-2.5 font-bold transition-colors
                hover:bg-brand-primary/10 hover:text-brand-primary rounded-xl text-gray-700'>
                My Profile
              </Link>
              <Link href='/account/orders' className='block px-3 py-2.5 font-bold transition-colors
                hover:bg-brand-primary/10 hover:text-brand-primary rounded-xl text-gray-700'>
                My Orders
              </Link>
              <Link href='/account/listings' className='block px-3 py-2.5 font-bold transition-colors
                hover:bg-brand-primary/10 hover:text-brand-primary rounded-xl text-gray-700'>
                My Listings
              </Link>
              <button onClick={handleLogout}
                className='w-full text-left px-3 py-2.5 text-red-500 font-bold transition-colors
                           hover:bg-red-50 hover:text-red-600 rounded-xl mt-2'>
                Log Out
              </button>
            </>
          )}
        </nav>

        {/* FOOTER */}
        <div className='p-4 border-t border-gray-100 text-[10px] font-bold text-gray-400 bg-gray-50/50'>
          <p>0 800 300-HAT</p>
          <p>support@campushat.com</p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
