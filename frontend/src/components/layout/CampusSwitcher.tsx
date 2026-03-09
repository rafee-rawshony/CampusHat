'use client'

import { useState } from 'react'
import { ChevronDown, Search, MapPin, Globe } from 'lucide-react'
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

const MOCK_CAMPUSES: Campus[] = [
    { id: '1', name: 'University of Dhaka', short_name: 'DU' },
    { id: '2', name: 'BUET', short_name: 'BUET' },
    { id: '3', name: 'North South University', short_name: 'NSU' },
    { id: '4', name: 'BRAC University', short_name: 'BRACU' },
]

export function CampusSwitcher() {
    const [selected, setSelected] = useState<Campus | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    const filtered = MOCK_CAMPUSES.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-xs uppercase tracking-wide font-semibold">
                    <MapPin className="h-3.5 w-3.5" />
                    {selected ? selected.short_name : 'Switch Campus'}
                    <ChevronDown className="h-3 w-3" />
                </Button>
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
                    onClick={() => setSelected(null)}
                    className="gap-2"
                >
                    <Globe className="h-4 w-4" />
                    All Campuses (Global)
                </DropdownMenuItem>
                {filtered.map((campus) => (
                    <DropdownMenuItem
                        key={campus.id}
                        onClick={() => setSelected(campus)}
                        className="gap-2"
                    >
                        <MapPin className="h-4 w-4" />
                        {campus.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
