'use client'

import React from 'react'
import { Menu, Bell } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SellerSidebarContent } from './SellerSidebar'
import { NotificationBell } from '@/components/layout/NotificationBell'

export function SellerMobileHeader() {
    return (
        <header className="md:hidden bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 sticky top-0 z-50">
            <Sheet>
                <SheetTrigger asChild>
                    <button className="text-gray-600 p-1 -ml-1 hover:bg-gray-100 rounded-lg transition-colors">
                        <Menu className="w-6 h-6" />
                    </button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[240px]">
                    <div className="h-full flex flex-col bg-white">
                        <SellerSidebarContent />
                    </div>
                </SheetContent>
            </Sheet>

            <h1 className="font-bold text-sm text-gray-900 tracking-tight">Seller Control Center</h1>

            <NotificationBell />
        </header>
    )
}
