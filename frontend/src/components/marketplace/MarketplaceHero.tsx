'use client'

import { useCampusStore } from '@/stores/campus.store'

export function MarketplaceHero() {
    const { selectedCampusName } = useCampusStore()

    const heading = selectedCampusName
        ? `${selectedCampusName.includes(' (') ? selectedCampusName.split(' (')[0] : selectedCampusName} Marketplace`
        : 'Global Campus Marketplace'

    const subtitle = selectedCampusName
        ? `Secure student-to-student commerce exclusive to ${selectedCampusName}.`
        : 'Discover items and services across all university communities.'

    return (
        <div className="relative text-center py-14 md:py-16 overflow-hidden">
            {/* Subtle background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#4C3B8A]/[0.03] to-transparent pointer-events-none" />

            <div className="relative z-10">
                <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-black text-gray-900 tracking-tight leading-tight">
                    {heading}
                </h1>
                <p className="text-gray-500 mt-3 max-w-2xl mx-auto font-medium text-sm md:text-base">
                    {subtitle}
                </p>
            </div>
        </div>
    )
}
