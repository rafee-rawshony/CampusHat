'use client'

import { AnnouncementBar } from './AnnouncementBar'
import { Navbar } from './Navbar'
import { SecondaryNav } from './SecondaryNav'
import { MobileBottomNav } from './MobileBottomNav'
import { Footer } from './Footer'

interface MainLayoutProps {
    children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col">
            <AnnouncementBar />
            <Navbar />
            <div className="hidden sm:block">
                <SecondaryNav />
            </div>
            <main className="flex-1 pb-16 sm:pb-0">{children}</main>
            <Footer />
            <MobileBottomNav />
        </div>
    )
}
