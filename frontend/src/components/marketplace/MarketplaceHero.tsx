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
        <div className="text-center py-12">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                {heading}
            </h1>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto font-medium">
                {subtitle}
            </p>
        </div>
    )
}
