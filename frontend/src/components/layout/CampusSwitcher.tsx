'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Search, Building2, Globe } from 'lucide-react'
import { useCampusStore } from '@/stores/campus.store'
import { api } from '@/lib/api'

interface Campus {
    id: string
    name: string
    short_name: string
}

export function CampusSwitcher() {
    const { selectedCampusId, selectedCampusName, setCampus, clearCampus } = useCampusStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [campuses, setCampuses] = useState<Campus[]>([])
    const [open, setOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const searchRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        api.get('/universities/?page_size=1000').then(res => {
            const raw = res.data?.data || res.data
            const results = raw?.results || (Array.isArray(raw) ? raw : [])
            if (Array.isArray(results) && results.length > 0) {
                setCampuses(results.map((u: any) => ({
                    id: String(u.id),
                    name: u.name,
                    short_name: u.short_name || u.short_code || u.name.substring(0, 5)
                })))
            }
        }).catch(err => console.error("Failed to fetch campuses", err))
    }, [])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    useEffect(() => {
        if (open) setTimeout(() => searchRef.current?.focus(), 100)
    }, [open])

    const filtered = campuses.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.short_name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setOpen(!open)}
                className={`bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg px-3 md:px-4 py-1.5 transition-all flex items-center gap-2 shadow-sm ${open ? 'bg-white/20 ring-2 ring-white/20' : ''}`}
            >
                <Building2 className="h-3 w-3 opacity-70" />
                <span className="text-[10px] md:text-xs font-extrabold uppercase tracking-tight text-white">Switch Campus</span>
                <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Search */}
                    <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="Find your university..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#4C3B8A] outline-none text-gray-800 font-medium"
                            />
                        </div>
                    </div>

                    {/* Options */}
                    <div className="max-h-64 overflow-y-auto p-2">
                        <button
                            onClick={() => { clearCampus(); setOpen(false); setSearchQuery('') }}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors mb-1 ${!selectedCampusId ? 'bg-purple-50 text-[#4C3B8A] font-bold' : 'text-gray-600 hover:bg-gray-50 font-semibold'}`}
                        >
                            <Globe className="inline-block w-4 h-4 mr-2 opacity-50" /> All Campuses (Global)
                        </button>
                        <div className="h-px bg-gray-100 my-1 mx-2" />
                        {filtered.map((campus) => (
                            <button
                                key={campus.id}
                                onClick={() => { setCampus(campus.id, campus.name); setOpen(false); setSearchQuery('') }}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs transition-colors leading-tight ${String(selectedCampusId) === campus.id ? 'bg-purple-50 text-[#4C3B8A] font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}
                            >
                                {campus.name}
                            </button>
                        ))}

                        {filtered.length === 0 && campuses.length === 0 && (
                            <div className="px-4 py-8 text-center">
                                <p className="text-gray-400 text-xs font-bold">Loading universities...</p>
                            </div>
                        )}
                        {filtered.length === 0 && campuses.length > 0 && (
                            <div className="px-4 py-8 text-center">
                                <p className="text-gray-400 text-xs font-bold">No results found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
