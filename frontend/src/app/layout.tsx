import type { Metadata } from 'next'
import { Providers } from './providers'
import { MainLayout } from '@/components/layout/MainLayout'
import './globals.css'

export const metadata: Metadata = {
  title: 'CampusHat — Campus Commerce Platform',
  description:
    'Buy, sell, rent, and discover services across your campus. CampusHat connects students and faculty in one unified marketplace.',
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
        </Providers>
      </body>
    </html>
  )
}
