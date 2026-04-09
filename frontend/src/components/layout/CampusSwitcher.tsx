'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Search, MapPin, Globe } from 'lucide-react'
import { useCampusStore } from '@/stores/campus.store'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Campus {
    id: string
    name: string
    short_name: string
}

// We'll fetch from API but keep a fallback
const FALLBACK_CAMPUSES: Campus[] = [
    { id: '1', name: 'University of Dhaka', short_name: 'DU' },
    { id: '2', name: 'BUET', short_name: 'BUET' },
    { id: '3', name: 'North South University', short_name: 'NSU' },
    { id: '4', name: 'BRAC University', short_name: 'BRACU' },
]

export function CampusSwitcher() {
    const { selectedCampusId, selectedCampusName, setCampus, clearCampus } = useCampusStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [campuses, setCampuses] = useState<Campus[]>(FALLBACK_CAMPUSES)

    useEffect(() => {
        // Fetch real universities
        api.get('/universities/').then(res => {
            const data = res.data?.results || res.data?.data || res.data || []
            if (data.length > 0) {
                setCampuses(data.map((u: any) => ({
                    id: u.id.toString(),
                    name: u.name,
                    short_name: u.short_name || u.name.substring(0, 5)
                })))
            }
        }).catch(err => console.error("Failed to fetch campuses", err))
    }, [])

    const filtered = campuses.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.short_name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg px-2 sm:px-3 md:px-4 py-1.5 transition-all flex items-center gap-1 sm:gap-2 shadow-sm text-[10px] md:text-xs font-extrabold uppercase tracking-tight text-white whitespace-nowrap overflow-hidden max-w-[150px] sm:max-w-none">
                    <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 hidden sm:block" />
                    <span className="truncate">{selectedCampusName ? selectedCampusName : 'Switch Campus'}</span>
                    <ChevronDown className="h-3 w-3 shrink-0" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <div className="p-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search campus..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 pl-8 text-sm"
                        />
                    </div>
                </div>
                <DropdownMenuItem
                    onClick={() => clearCampus()}
                    className="gap-2 cursor-pointer font-medium"
                >
                    <Globe className="h-4 w-4" />
                    All Campuses (Global)
                </DropdownMenuItem>
                {filtered.map((campus) => (
                    <DropdownMenuItem
                        key={campus.id}
                        onClick={() => setCampus(parseInt(campus.id), campus.short_name)}
                        className="gap-2 cursor-pointer"
                    >
                        <MapPin className="h-4 w-4" />
                        {campus.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
