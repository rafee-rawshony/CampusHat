'use client'

import React from 'react'
import { Menu, Bell } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SellerSidebarContent } from './SellerSidebar'

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

            <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
        </header>
    )
}
