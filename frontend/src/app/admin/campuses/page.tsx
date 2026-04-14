'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Building2, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'

import CampusGrid from '@/components/admin/CampusNetwork/CampusGrid'
import AddUniversityDialog from '@/components/admin/CampusNetwork/AddUniversityDialog'
import EditUniversityDrawer from '@/components/admin/CampusNetwork/EditUniversityDrawer'
import { CampusType } from '@/components/admin/CampusNetwork/CampusCard'

export default function AdminCampusesPage() {
    const { isAdmin, _hasHydrated } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        if (_hasHydrated && !isAdmin()) {
            router.replace('/admin/approvals')
        }
    }, [_hasHydrated, isAdmin, router])

    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')
    const [cityFilter, setCityFilter] = useState('All Cities')

    // Modal/Drawer state
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editCampus, setEditCampus] = useState<CampusType | null>(null)

    // Data fetching
    const { data, isLoading } = useQuery({
        queryKey: ['admin-universities'],
        queryFn: async () => {
            const res = await api.get('/universities/?include_inactive=true')
            return res.data?.data?.results || res.data?.results || res.data || []
        },
        staleTime: 60_000,
    })

    const campuses: CampusType[] = Array.isArray(data) ? data : []
    
    // Derived stats
    const activeCount = campuses.filter(c => c.is_active).length
    const inactiveCount = campuses.filter(c => !c.is_active).length
    const totalStudents = campuses.reduce((sum, c) => sum + (c.student_count || 0), 0)

    // Filtering logic
    const filtered = campuses.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.short_name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'All' ? true : statusFilter === 'Active Only' ? c.is_active : !c.is_active
        const matchesCity = cityFilter === 'All Cities' ? true : c.district === cityFilter || (cityFilter === 'Other' && !['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi'].includes(c.district || ''))
        return matchesSearch && matchesStatus && matchesCity
    })

    if (!_hasHydrated) return null

    return (
        <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto h-full overflow-y-auto">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Campus Network</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage universities and campuses on the platform.</p>
                </div>
                <Button 
                    onClick={() => setIsAddOpen(true)}
                    className="bg-[#4C3B8A] hover:bg-[#3d2e6e] text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Add University
                </Button>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
                    <Building2 className="text-green-500 w-4 h-4" />
                    <span className="font-medium text-gray-900">{activeCount}</span>
                    <span className="text-gray-500">Active Universities</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
                    <Building2 className="text-gray-400 w-4 h-4" />
                    <span className="font-medium text-gray-900">{inactiveCount}</span>
                    <span className="text-gray-500">Inactive</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
                    <Users className="text-[#4C3B8A] w-4 h-4" />
                    <span className="font-medium text-gray-900">{totalStudents}</span>
                    <span className="text-gray-500">Registered Students</span>
                </div>
            </div>

            {/* Search + Filter Bar */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 flex-wrap shadow-sm">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                        placeholder="Search universities..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm border-gray-200 rounded-lg shadow-sm w-full"
                    />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px] bg-gray-50 border-gray-200">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="Active Only">Active Only</SelectItem>
                        <SelectItem value="Inactive Only">Inactive Only</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger className="w-[160px] bg-gray-50 border-gray-200">
                        <SelectValue placeholder="City" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All Cities">All Cities</SelectItem>
                        <SelectItem value="Dhaka">Dhaka</SelectItem>
                        <SelectItem value="Chittagong">Chittagong</SelectItem>
                        <SelectItem value="Sylhet">Sylhet</SelectItem>
                        <SelectItem value="Rajshahi">Rajshahi</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>

                <div className="text-sm text-gray-400 px-2 min-w-[200px] text-right ml-auto">
                    Showing <strong className="text-gray-700">{filtered.length}</strong> of {campuses.length} universities
                </div>
            </div>

            {/* Grid */}
            <CampusGrid 
                campuses={filtered} 
                isLoading={isLoading} 
                searchTerm={searchTerm}
                onEdit={setEditCampus}
                onAdd={() => setIsAddOpen(true)}
            />

            {/* Dialogs */}
            <AddUniversityDialog 
                isOpen={isAddOpen} 
                onClose={() => setIsAddOpen(false)} 
            />
            
            <EditUniversityDrawer 
                university={editCampus} 
                isOpen={!!editCampus} 
                onClose={() => setEditCampus(null)} 
            />

        </div>
    )
}
