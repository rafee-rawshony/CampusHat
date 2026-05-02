'use client'

import { useState, useEffect, useRef } from 'react'
import { AnnouncementBar } from './AnnouncementBar'
import { Navbar } from './Navbar'
import { SecondaryNav } from './SecondaryNav'
import { MobileBottomNav } from './MobileBottomNav'
import { Footer } from './Footer'
import { ProfileCompletionBanner } from './ProfileCompletionBanner'
import { usePathname } from 'next/navigation'

interface MainLayoutProps {
    children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
    const pathname = usePathname()
    const headerRef = useRef<HTMLElement>(null)
    const [headerHeight, setHeaderHeight] = useState(0)

    useEffect(() => {
        const update = () => {
            if (headerRef.current) {
                setHeaderHeight(headerRef.current.offsetHeight)
            }
        }
        update()
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
    }, [])

    // Exclude global layout wrappers for admin dashboard routes
    // as it manages its own internal Sidebar and top bar.
    if (pathname && pathname.startsWith('/admin')) {
        return <>{children}</>
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Fixed Header Stack */}
            <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
                <AnnouncementBar />
                <ProfileCompletionBanner />
                <Navbar />
                <div className="hidden sm:block">
                    <SecondaryNav />
                </div>
            </header>
            {/* Spacer to push content below fixed header */}
            <div style={{ height: headerHeight || 140 }} className="shrink-0" />
            <main className="flex-1 pb-16 sm:pb-0">{children}</main>
            <Footer />
            <MobileBottomNav />
        </div>
    )
}
