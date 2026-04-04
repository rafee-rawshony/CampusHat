'use client'

import { useAuthStore } from '@/stores/auth.store'


import { Plus, Tags, Save, Trash2, Power, PowerOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'

type CatTab = 'mall' | 'marketplace'

export default function AdminCategoriesPage() {
    const { isAdmin } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        if (!isAdmin()) {
            router.replace('/admin/approvals')
        }
    }, [])

    const [tab, setTab] = useState<CatTab>('mall')
    const [categories, setCategories] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Modal state
    const [editTarget, setEditTarget] = useState<any>(null) // null = closed, {} = new, {id...} = edit
    const [formData, setFormData] = useState({ name: '', icon: 'Tag', displayOrder: 0, isActive: true })

    useEffect(() => {
        // API MOCK: GET /api/v1/{tab}/categories/
        setIsLoading(true)
        setTimeout(() => {
            if (tab === 'mall') {
                setCategories([
                    { id: 'm1', name: 'Textbooks & Academic', icon: 'BookOpen', displayOrder: 1, isActive: true },
                    { id: 'm2', name: 'Electronics & Gadgets', icon: 'Laptop', displayOrder: 2, isActive: true },
                    { id: 'm3', name: 'Dorm Furniture', icon: 'BedDouble', displayOrder: 3, isActive: true },
                    { id: 'm4', name: 'Campus Merchandise', icon: 'Shirt', displayOrder: 4, isActive: true },
                    { id: 'm5', name: 'Stationery Supplies', icon: 'PenTool', displayOrder: 5, isActive: true },
                ])
            } else {
                setCategories([
                    { id: 'mk1', name: 'Pre-owned Books', icon: 'BookDashed', displayOrder: 1, isActive: true },
                    { id: 'mk2', name: 'Used Electronics', icon: 'MonitorSmartphone', displayOrder: 2, isActive: true },
                    { id: 'mk3', name: 'Tutoring Services', icon: 'GraduationCap', displayOrder: 3, isActive: true },
                    { id: 'mk4', name: 'Freelance & Creative', icon: 'Palette', displayOrder: 4, isActive: true },
                    { id: 'mk5', name: 'Roommate Wanted', icon: 'Users', displayOrder: 5, isActive: true },
                    { id: 'mk6', name: 'Homemade Food', icon: 'Utensils', displayOrder: 6, isActive: false },
                ])
            }
            setIsLoading(false)
        }, 400)
    }, [tab])

    const handleOpenEdit = (cat?: any) => {
        if (cat) {
            setFormData({ name: cat.name, icon: cat.icon, displayOrder: cat.displayOrder, isActive: cat.isActive })
            setEditTarget(cat)
        } else {
            setFormData({ name: '', icon: 'Tag', displayOrder: categories.length + 1, isActive: true })
            setEditTarget({ isNew: true })
        }
    }

    const handleSave = () => {
        if (!formData.name) { toast.error('Category name required'); return }

        if (editTarget.isNew) {
            const newCat = { id: Date.now().toString(), ...formData }
            setCategories([...categories, newCat].sort((a, b) => a.displayOrder - b.displayOrder))
            toast.success('Category created')
        } else {
            setCategories(categories.map(c => c.id === editTarget.id ? { ...c, ...formData } : c).sort((a, b) => a.displayOrder - b.displayOrder))
            toast.success('Category updated')
        }
        setEditTarget(null)
    }

    const handleDelete = () => {
        setCategories(categories.filter(c => c.id !== editTarget.id))
        toast.success('Category deleted')
        setEditTarget(null)
    }

    return (
        <div className="p-6 lg:p-8 space-y-8 max-w-6xl mx-auto h-full flex flex-col">

            {/* Header */}
            <div className="shrink-0">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Taxonomy Manager</h1>
                <p className="text-gray-500 text-sm mt-1">Organize product and ad categories.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit shrink-0">
                <button
                    onClick={() => setTab('mall')}
                    className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all
                        ${tab === 'mall' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Mall Categories
                </button>
                <button
                    onClick={() => setTab('marketplace')}
                    className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all
                        ${tab === 'marketplace' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Marketplace Categories
                </button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl"></div>)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 content-start">
                        {categories.map(cat => (
                            <div
                                key={cat.id}
                                onClick={() => handleOpenEdit(cat)}
                                className={`bg-white rounded-2xl border-2 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 transition-all overflow-hidden relative group
                                    ${cat.isActive ? 'border-gray-100 hover:border-brand-primary/20' : 'border-gray-200/50 opacity-60 hover:opacity-100'}`}
                            >
                                <div className="p-5 flex items-center justify-between gap-4 h-full">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors
                                            ${cat.isActive ? 'bg-indigo-50 text-indigo-500 group-hover:bg-brand-primary group-hover:text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            <Tags className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className={`font-black truncate ${cat.isActive ? 'text-gray-900' : 'text-gray-500 line-through decoration-gray-300'}`}>
                                                {cat.name}
                                            </h3>
                                            <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mt-1">Order: {cat.displayOrder}</p>
                                        </div>
                                    </div>
                                    {!cat.isActive && <PowerOff className="w-4 h-4 text-red-400 shrink-0" />}
                                </div>
                            </div>
                        ))}

                        {/* Add Button */}
                        <div
                            onClick={() => handleOpenEdit()}
                            className="bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-all flex flex-col items-center justify-center min-h-[100px] text-gray-400 hover:text-brand-primary group"
                        >
                            <Plus className="w-6 h-6 mb-2 group-hover:scale-125 transition-transform" />
                            <span className="text-sm font-bold">New Category</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Drawer Modal */}
            <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null) }}>
                <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
                    <div className="bg-white border-b border-gray-100 p-6 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                            <Tags className="w-8 h-8 text-indigo-500" />
                        </div>
                        <DialogTitle className="text-xl font-black text-gray-900">
                            {editTarget?.isNew ? 'New Category' : 'Edit Category'}
                        </DialogTitle>
                        <p className="text-sm text-gray-500 mt-1">Modify properties for the {tab} taxonomy.</p>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Category Name</label>
                            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Electronics & Gadgets" className="bg-gray-50 border-gray-200 rounded-xl font-bold" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Lucide Icon</label>
                                <Input value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} placeholder="BookOpen" className="bg-gray-50 border-gray-200 rounded-xl" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Display Order</label>
                                <Input type="number" value={formData.displayOrder} onChange={e => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })} className="bg-gray-50 border-gray-200 rounded-xl" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                            <div className="flex items-center gap-3">
                                {formData.isActive ? <Power className="w-4 h-4 text-emerald-500" /> : <PowerOff className="w-4 h-4 text-gray-400" />}
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Active Status</p>
                                    <p className="text-xs text-gray-500 font-medium">Toggle visibility on the frontend.</p>
                                </div>
                            </div>
                            <Switch checked={formData.isActive} onCheckedChange={c => setFormData({ ...formData, isActive: c })} />
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                        {!editTarget?.isNew && (
                            <Button variant="outline" onClick={handleDelete} className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl w-12 px-0 shrink-0">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => setEditTarget(null)} className="flex-1 rounded-xl border-gray-200 text-gray-600 font-bold">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} className="flex-1 bg-brand-primary hover:bg-brand-dark text-white font-bold rounded-xl shadow-sm gap-2">
                            <Save className="w-4 h-4" /> Save
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    )
}
