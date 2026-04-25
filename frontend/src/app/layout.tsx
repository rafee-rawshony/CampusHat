import type { Metadata, Viewport } from 'next'
import { Providers } from './providers'
import { MainLayout } from '@/components/layout/MainLayout'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#4C3B8A',
}

export const metadata: Metadata = {
  title: 'CampusHat — Campus Commerce Platform',
  description:
    'Buy, sell, rent, and discover services across your campus. CampusHat connects students and faculty in one unified marketplace.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
  },
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
