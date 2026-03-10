'use client'

import React, { useState, useEffect } from 'react'
import { Building2, Plus, Search, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
} from '@/components/ui/drawer'
import { useToast } from '@/hooks/use-toast'


interface Campus {
    id: string
    name: string
    short_code: string
    city: string
    is_active: boolean
}

export default function CampusesPage() {
    const { toast } = useToast()
    const [campuses, setCampuses] = useState<Campus[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    // Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null)
    const [isAddingNew, setIsAddingNew] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        short_code: '',
        city: '',
        is_active: true
    })

    useEffect(() => {
        setIsLoading(true)
        // Mocking API fetch: api.get('/universities/?include_inactive=true')
        setTimeout(() => {
            const mockData = [
                { id: '1', name: 'American International University-Bangladesh', short_code: 'AIUB', city: 'Dhaka', is_active: true },
                { id: '2', name: 'BRAC University', short_code: 'BRACU', city: 'Dhaka', is_active: true },
                { id: '3', name: 'Daffodil International University', short_code: 'DIU', city: 'Dhaka', is_active: true },
                { id: '4', name: 'North South University', short_code: 'NSU', city: 'Dhaka', is_active: true },
                { id: '5', name: 'Independent University, Bangladesh', short_code: 'IUB', city: 'Dhaka', is_active: false },
                { id: '6', name: 'Bangladesh University of Engineering and Technology', short_code: 'BUET', city: 'Dhaka', is_active: true },
            ]
            setCampuses(mockData)
            setIsLoading(false)
        }, 600)
    }, [])

    const filteredCampuses = campuses.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.short_code.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name))

    const openEditDrawer = (campus: Campus) => {
        setSelectedCampus(campus)
        setIsAddingNew(false)
        setFormData({
            name: campus.name,
            short_code: campus.short_code,
            city: campus.city,
            is_active: campus.is_active
        })
        setIsDrawerOpen(true)
    }

    const openAddDrawer = () => {
        setSelectedCampus(null)
        setIsAddingNew(true)
        setFormData({ name: '', short_code: '', city: '', is_active: true })
        setIsDrawerOpen(true)
    }

    const handleSave = async () => {
        if (!formData.name || !formData.short_code) {
            toast({ title: 'Validation Error', description: 'Name and short code are required.', variant: 'destructive' })
            return
        }

        try {
            if (isAddingNew) {
                // Mock API POST
                const newCampus = { id: Math.random().toString(), ...formData }
                setCampuses(prev => [...prev, newCampus])
                toast({ title: 'Success', description: 'University added to the network.' })
            } else if (selectedCampus) {
                // Mock API PATCH
                setCampuses(prev => prev.map(c => c.id === selectedCampus.id ? { ...c, ...formData } : c))
                toast({ title: 'Success', description: 'University details updated.' })
            }
            setIsDrawerOpen(false)
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to save university data.', variant: 'destructive' })
        }
    }

    const handleToggleActive = () => {
        setFormData(prev => ({ ...prev, is_active: !prev.is_active }))
    }

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        Campus Network
                    </h1>
                    <p className="text-gray-500 mt-1">Managing {campuses.filter(c => c.is_active).length} active universities</p>
                </div>
                <Button onClick={openAddDrawer} className="bg-brand-primary hover:bg-brand-primary-hover text-white shadow-md rounded-xl font-bold h-11 px-6">
                    <Plus className="w-5 h-5 mr-1.5" /> Add University
                </Button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                    placeholder="Search campuses by name or shorthand..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 h-14 bg-white border-gray-200 rounded-2xl text-base shadow-sm focus-visible:ring-brand-primary"
                />
            </div>

            {/* Main Grid */}
            <div className="flex-1 overflow-auto pb-10">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-20 bg-gray-200 rounded-2xl" />)}
                    </div>
                ) : filteredCampuses.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 border-dashed">
                        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-gray-900">No campuses found</h3>
                        <p className="text-sm text-gray-500">Try adjusting your search query.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredCampuses.map(campus => (
                            <div
                                key={campus.id}
                                onClick={() => openEditDrawer(campus)}
                                className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-primary/30 transition-all cursor-pointer flex items-center justify-between"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0
                                        ${campus.is_active ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {campus.short_code}
                                    </div>
                                    <div>
                                        <h3 className={`font-bold transition-colors group-hover:text-brand-primary ${campus.is_active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                                            {campus.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-semibold text-gray-500">{campus.city}</span>
                                            {!campus.is_active && (
                                                <span className="bg-red-100 text-red-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Inactive</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-gray-300 group-hover:text-brand-primary transition-colors">
                                    <MoreHorizontal className="w-5 h-5" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit/Add Drawer Sidebar Overlay */}
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction="right">
                <DrawerContent className="bg-white flex flex-col rounded-t-[10px] h-full w-[400px] mt-24 fixed bottom-0 right-0">
                    <DrawerHeader className="text-left border-b border-gray-100 pb-4">
                        <DrawerTitle className="font-extrabold text-2xl text-gray-900">
                            {isAddingNew ? 'Add New University' : 'Edit University Node'}
                        </DrawerTitle>
                        <DrawerDescription className="text-gray-500">
                            Modify campus parameters and active status.
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="p-6 flex-1 overflow-y-auto space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="uni-name" className="text-gray-700 font-bold">University Full Name</Label>
                            <Input
                                id="uni-name"
                                value={formData.name}
                                onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                                placeholder="e.g. American International University"
                                className="bg-gray-50 h-12"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="short-code" className="text-gray-700 font-bold">Short Code</Label>
                                <Input
                                    id="short-code"
                                    value={formData.short_code}
                                    onChange={e => setFormData(f => ({ ...f, short_code: e.target.value.toUpperCase() }))}
                                    placeholder="e.g. AIUB"
                                    className="bg-gray-50 h-10 font-mono tracking-widest text-center"
                                    maxLength={8}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city" className="text-gray-700 font-bold">Location / City</Label>
                                <Input
                                    id="city"
                                    value={formData.city}
                                    onChange={e => setFormData(f => ({ ...f, city: e.target.value }))}
                                    placeholder="Dhaka"
                                    className="bg-gray-50 h-10"
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between mt-4">
                            <div>
                                <h4 className="font-bold text-gray-900 mb-0.5">Campus Network Status</h4>
                                <p className="text-xs text-gray-500">
                                    {formData.is_active
                                        ? 'Active. Students can select this campus.'
                                        : 'Inactive. Campus hidden from public dropdowns.'}
                                </p>
                            </div>
                            <Switch checked={formData.is_active} onCheckedChange={handleToggleActive} />
                        </div>
                    </div>

                    <DrawerFooter className="border-t border-gray-100 pt-4 pb-8 flex-row gap-3">
                        <Button variant="outline" className="flex-1 h-12" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
                        <Button className="flex-1 h-12 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold" onClick={handleSave}>
                            {isAddingNew ? 'Create University' : 'Save Changes'}
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

        </div>
    )
}
