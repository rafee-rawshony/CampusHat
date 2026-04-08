import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import { Helmet } from 'react-helmet-async'
import { Button } from '@/components/ui/button'
import { Search, Plus, MapPin, Building2, Edit, X, Globe } from 'lucide-react'

// Simple specific Modal rather than full shadcn Dialog 
function EditCampusModal({ isOpen, onClose, campus, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: campus?.name || '',
    domain: campus?.domain || '',
    city: campus?.city || '',
    country: campus?.country || 'Bangladesh'
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (campus) {
        await api.patch(`/universities/${campus.id}/`, formData)
      } else {
        await api.post(`/universities/`, formData)
      }
      onSuccess()
    } catch (err) {
      console.error(err)
      alert("Failed to save campus")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors">
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          {campus ? <Edit className="text-brand-primary" size={20} /> : <Plus className="text-brand-primary" size={20} />} 
          {campus ? 'Edit Campus' : 'Add New Campus'}
        </h2>

        <form onSubmit={handleSave} className="space-y-4 mb-2">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">University Name</label>
             <input required type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:border-brand-primary" placeholder="e.g. Dhaka University" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Email Domain / Alias</label>
             <input required type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:border-brand-primary" placeholder="e.g. du.ac.bd" value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})} />
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input required type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:border-brand-primary" placeholder="e.g. Dhaka" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input required type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:border-brand-primary" placeholder="e.g. Bangladesh" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} />
              </div>
           </div>
           
           <div className="flex gap-3 justify-end pt-6">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Campus'}</Button>
           </div>
        </form>

      </div>
    </div>
  )
}

export default function AdminCampusesPage() {
  const queryClient = useQueryClient()
  const { isAdmin } = useAuthStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [editingCampus, setEditingCampus] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  // Guard Clause as required
  if (!isAdmin()) return <Navigate to='/admin/approvals' replace />

  const { data: campuses, isLoading } = useQuery({
    queryKey: ['admin-campuses', searchQuery],
    queryFn: () => api.get(`/universities/?search=${searchQuery}`).then(r => r.data.data)
  })

  const handleEdit = (campus: any) => {
    setEditingCampus(campus)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingCampus(null)
    setShowModal(true)
  }

  return (
    <>
      <Helmet><title>Campuses | Admin Hub</title></Helmet>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campus Directory</h1>
          <p className="text-gray-500 mt-1">Manage supported universities and email domains.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
           <div className="relative flex-1 sm:w-64">
              <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search campus..." 
                className="w-full pl-10 pr-3 py-2 border rounded-xl focus:border-brand-primary outline-none shadow-sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
           </div>
           <Button onClick={handleAdd} className="shadow-sm shrink-0">
              <Plus className="mr-2" size={18} /> Add Campus
           </Button>
        </div>
      </div>

      <div>
         {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-white border shadow-sm animate-pulse rounded-2xl" />)}
            </div>
         ) : !campuses || campuses.length === 0 ? (
            <div className="bg-white rounded-2xl border p-12 text-center shadow-sm">
               <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
               <h3 className="text-lg font-bold text-gray-900 mb-1">No Campuses Found</h3>
               <p className="text-gray-500">We couldn't find any universities matching your search.</p>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {campuses.map((campus: any) => (
                  <div key={campus.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow relative group">
                     
                     <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center shrink-0">
                           <Building2 size={24} />
                        </div>
                        <button 
                          onClick={() => handleEdit(campus)}
                          className="p-1.5 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Edit size={18} />
                        </button>
                     </div>

                     <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1" title={campus.name}>{campus.name}</h3>
                     <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1"><MapPin size={14}/> {campus.city}, {campus.country}</span>
                     </div>
                     
                     <div className="bg-gray-50/80 p-2.5 rounded-lg border border-gray-100 text-xs font-mono text-gray-600 flex items-center gap-1.5">
                        <Globe size={14} className="text-brand-primary shrink-0"/> @{campus.domain}
                     </div>

                  </div>
               ))}
            </div>
         )}
      </div>

      <EditCampusModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        campus={editingCampus}
        onSuccess={() => {
           setShowModal(false)
           queryClient.invalidateQueries({ queryKey: ['admin-campuses'] })
        }}
      />
    </>
  )
}
