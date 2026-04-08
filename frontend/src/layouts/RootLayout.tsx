import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { MobileBottomTabBar } from '@/components/layout/MobileBottomTabBar'
import { Footer } from '@/components/layout/Footer'
import { CartDrawer } from '@/components/layout/CartDrawer'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'

export function RootLayout() {
  return (
    <div className="min-h-screen bg-surface-base flex flex-col">
      <MobileHeader />
      <Navbar />
      <main className="flex-1 page-content"><Outlet /></main>
      <Footer />
      <MobileBottomTabBar />
      <CartDrawer />
      <PWAInstallPrompt />
    </div>
  )
}
