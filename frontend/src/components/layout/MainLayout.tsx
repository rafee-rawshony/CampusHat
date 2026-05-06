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
        const el = headerRef.current
        if (!el) return

        const update = () => setHeaderHeight(el.offsetHeight)
        update()

        // Re-measure on window resize
        window.addEventListener('resize', update)

        // Re-measure when the header itself grows/shrinks
        // (e.g. ProfileCompletionBanner appearing after auth hydration)
        let ro: ResizeObserver | undefined
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(update)
            ro.observe(el)
        }

        return () => {
            window.removeEventListener('resize', update)
            ro?.disconnect()
        }
    }, [])

    // Exclude global layout wrappers for admin and seller dashboard routes —
    // both manage their own internal Sidebar and top bar.
    if (pathname && (pathname.startsWith('/admin') || pathname.startsWith('/seller'))) {
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
