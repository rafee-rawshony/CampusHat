import type { Metadata, Viewport } from 'next'
import { Providers } from './providers'
import { MainLayout } from '@/components/layout/MainLayout'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#634C9F',
}

export const metadata: Metadata = {
  title: 'CampusHat — Campus Commerce Platform',
  description:
    'Buy, sell, rent, and discover services across your campus. CampusHat connects students and faculty in one unified marketplace.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CampusHat',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          <MainLayout>{children}</MainLayout>
          <PWAInstallPrompt />
        </Providers>
      </body>
    </html>
  )
}
