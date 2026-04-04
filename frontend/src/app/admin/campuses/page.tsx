'use client'

import { useAuthStore } from '@/stores/auth.store'


import { Plus, Search, Building2, MapPin, Hash, CheckCircle2, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'

export default function AdminCampusesPage() {
    const { isAdmin } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        if (!isAdmin()) {
            router.replace('/admin/approvals')
        }
    }, [])

    const [campuses, setCampuses] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Modal/Drawer state
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editCampus, setEditCampus] = useState<any>(null)

    // Form state
    const [formData, setFormData] = useState({ name: '', shortCode: '', city: '', isActive: true })

    useEffect(() => {
        // API MOCK: GET /api/v1/universities/?include_inactive=true
        setTimeout(() => {
            setCampuses([
                { id: 'u1', name: 'Ahsanullah University of Science and Technology', shortCode: 'AUST', city: 'Dhaka', isActive: true },
                { id: 'u2', name: 'American International University-Bangladesh', shortCode: 'AIUB', city: 'Dhaka', isActive: true },
                { id: 'u3', name: 'Bangladesh University of Engineering and Technology', shortCode: 'BUET', city: 'Dhaka', isActive: true },
                { id: 'u4', name: 'BRAC University', shortCode: 'BRAC', city: 'Dhaka', isActive: true },
                { id: 'u5', name: 'Daffodil International University', shortCode: 'DIU', city: 'Dhaka', isActive: true },
                { id: 'u6', name: 'East West University', shortCode: 'EWU', city: 'Dhaka', isActive: true },
                { id: 'u7', name: 'Independent University, Bangladesh', shortCode: 'IUB', city: 'Dhaka', isActive: true },
                { id: 'u8', name: 'North South University', shortCode: 'NSU', city: 'Dhaka', isActive: true },
                { id: 'u9', name: 'University of Dhaka', shortCode: 'DU', city: 'Dhaka', isActive: true },
                { id: 'u10', name: 'Utility Demo University (Inactive)', shortCode: 'UDU', city: 'Sylhet', isActive: false },
            ])
            setIsLoading(false)
        }, 500)
    }, [])

    const filtered = campuses.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.shortCode.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleOpenEdit = (campus: any) => {
        setFormData({ name: campus.name, shortCode: campus.shortCode, city: campus.city, isActive: campus.isActive })
        setEditCampus(campus)
    }

    const handleSave = () => {
        if (!formData.name || !formData.shortCode) { toast.error('Name and Short Code required'); return }

        if (editCampus) {
            // PATCH mock
            setCampuses(prev => prev.map(c => c.id === editCampus.id ? { ...c, ...formData } : c))
            toast.success('University updated')
            setEditCampus(null)
        } else {
            // POST mock
            const newCampus = { id: Date.now().toString(), ...formData }
            setCampuses(prev => [...prev, newCampus].sort((a, b) => a.name.localeCompare(b.name)))
            toast.success('University added')
            setIsAddOpen(false)
        }
    }

    return (
        <div className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto flex flex-col h-full">

            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Campus Network</h1>
                    <p className="text-gray-500 text-sm mt-1">Managing {campuses.filter(c => c.isActive).length} active universities</p>
                </div>
                <Button
                    onClick={() => { setFormData({ name: '', shortCode: '', city: 'Dhaka', isActive: true }); setIsAddOpen(true) }}
                    className="bg-brand-primary hover:bg-brand-dark text-white font-bold rounded-xl shadow-sm gap-2 whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" /> Add University
                </Button>
            </div>

            {/* Search */}
            <div className="relative shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                    placeholder="Search campuses by name or abbreviation..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-12 py-6 bg-white border-2 border-gray-200 focus-visible:ring-0 focus-visible:border-brand-primary rounded-2xl text-base shadow-sm"
                />
            </div>

            {/* List */}
            <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                {isLoading ? (
                    <div className="p-8 space-y-4 animate-pulse">
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl"></div>)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                        <Building2 className="w-12 h-12 mb-3" />
                        <p className="font-bold">No universities found matching &ldquo;{searchTerm}&rdquo;</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 content-start">
                        {filtered.map(campus => (
                            <div key={campus.id} className="flex items-center gap-3 group">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-brand-primary transition-colors shrink-0" />
                                <button
                                    onClick={() => handleOpenEdit(campus)}
                                    className={`text-left text-sm font-bold truncate flex-1 transition-colors hover:underline underline-offset-4
                                        ${campus.isActive ? 'text-brand-primary hover:text-brand-dark' : 'text-gray-400 line-through'}`}
                                >
                                    {campus.name}
                                </button>
                                {!campus.isActive && <span className="text-[10px] uppercase font-black tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md shrink-0">Inactive</span>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add / Edit Drawer Modal (Reused) */}
            <Dialog open={isAddOpen || !!editCampus} onOpenChange={(open) => { if (!open) { setIsAddOpen(false); setEditCampus(null) } }}>
                <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
                    <div className="bg-gray-50 border-b border-gray-100 p-6">
                        <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-brand-primary" />
                            {editCampus ? 'Edit University' : 'Add New University'}
                        </DialogTitle>
                        <p className="text-sm text-gray-500 mt-1">Configure campus routing and active status.</p>
                    </div>

                    <div className="p-6 space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Full Name</label>
                            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. University of Dhaka" className="bg-gray-50 border-gray-200 rounded-xl" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> Short Code</label>
                                <Input value={formData.shortCode} onChange={e => setFormData({ ...formData, shortCode: e.target.value })} placeholder="e.g. DU" className="bg-gray-50 border-gray-200 rounded-xl uppercase" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> City</label>
                                <Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="e.g. Dhaka" className="bg-gray-50 border-gray-200 rounded-xl" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                            <div>
                                <p className="text-sm font-bold text-gray-900">Campus Active</p>
                                <p className="text-xs text-gray-500 font-medium">Allow users to register and post ads here.</p>
                            </div>
                            <Switch checked={formData.isActive} onCheckedChange={c => setFormData({ ...formData, isActive: c })} />
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                        <Button variant="outline" onClick={() => { setIsAddOpen(false); setEditCampus(null) }} className="flex-1 rounded-xl border-gray-200 text-gray-600 font-bold">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} className="flex-1 bg-brand-primary hover:bg-brand-dark text-white font-bold rounded-xl shadow-sm">
                            {editCampus ? 'Save Changes' : 'Add University'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    )
}
