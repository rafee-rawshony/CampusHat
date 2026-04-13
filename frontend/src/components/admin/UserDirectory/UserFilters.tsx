import React, { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface FiltersState {
    search: string
    role: string
    university: string
    status: string
}

interface UserFiltersProps {
    filters: FiltersState
    setFilters: (f: FiltersState) => void
    totalUsers: number
    startIndex: number
    endIndex: number
}

const ROLES = [
    { value: 'all', label: 'All Roles' },
    { value: 'normal_user', label: 'Normal User' },
    { value: 'student', label: 'Student' },
    { value: 'faculty', label: 'Faculty' },
    { value: 'seller', label: 'Seller' },
    { value: 'seller_mod', label: 'Seller Mod' },
    { value: 'marketplace_mod', label: 'Marketplace Mod' },
    { value: 'moderator', label: 'Moderator' },
    { value: 'admin', label: 'Admin' },
]

const STATUSES = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active Only' },
    { value: 'suspended', label: 'Suspended Only' },
    { value: 'unverified', label: 'Unverified Only' },
]

export function UserFilters({ filters, setFilters, totalUsers, startIndex, endIndex }: UserFiltersProps) {
    const [localSearch, setLocalSearch] = useState(filters.search)

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (localSearch !== filters.search) {
                setFilters({ ...filters, search: localSearch })
            }
        }, 400)
        return () => clearTimeout(timeoutId)
    }, [localSearch, filters, setFilters])

    // Reset local search if parent resets
    useEffect(() => {
        if (filters.search === '') setLocalSearch('')
    }, [filters.search])

    const { data: universities = [] } = useQuery({
        queryKey: ['universities-list'],
        queryFn: () => api.get('/universities/').then(r => r.data?.data || r.data?.results || r.data)
    })

    const hasActiveFilters = filters.search || filters.role !== 'all' || filters.university !== 'all' || filters.status !== 'all'

    const handleClear = () => {
        setLocalSearch('')
        setFilters({
            search: '',
            role: 'all',
            university: 'all',
            status: 'all'
        })
    }

    return (
        <div className="mb-4">
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex flex-wrap gap-3 items-center">
                    
                    {/* Search */}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input 
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            placeholder="Search by name or email..."
                            className="bg-gray-50 border-gray-200 pl-9 pr-4 rounded-lg focus-visible:ring-[#4C3B8A]"
                        />
                    </div>

                    {/* Role Filter */}
                    <div className="w-full sm:w-[160px]">
                        <Select value={filters.role} onValueChange={(val) => setFilters({ ...filters, role: val })}>
                            <SelectTrigger className="bg-gray-50 border-gray-200 font-semibold text-gray-700">
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* University Filter */}
                    <div className="w-full sm:w-[180px]">
                        <Select value={filters.university} onValueChange={(val) => setFilters({ ...filters, university: val })}>
                            <SelectTrigger className="bg-gray-50 border-gray-200 font-semibold text-gray-700">
                                <SelectValue placeholder="All Universities" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Universities</SelectItem>
                                {universities.map((u: any) => (
                                    <SelectItem key={u.id} value={u.id}>{u.short_code || u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status Filter */}
                    <div className="w-full sm:w-[160px]">
                        <Select value={filters.status} onValueChange={(val) => setFilters({ ...filters, status: val })}>
                            <SelectTrigger className="bg-gray-50 border-gray-200 font-semibold text-gray-700">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Clear Button */}
                    {hasActiveFilters && (
                        <button 
                            onClick={handleClear}
                            className="text-[#4C3B8A] hover:underline text-sm font-semibold px-2 py-2 shrink-0 transition"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            </div>

            {/* Results Count */}
            {totalUsers > 0 && (
                <div className="px-2 mt-3">
                    <p className="text-sm text-gray-500 font-medium">
                        Showing <span className="font-bold text-gray-800">{startIndex}</span>-<span className="font-bold text-gray-800">{endIndex}</span> of <span className="font-bold text-gray-800">{totalUsers}</span> users
                    </p>
                </div>
            )}
        </div>
    )
}
