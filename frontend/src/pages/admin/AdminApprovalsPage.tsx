import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import { Helmet } from 'react-helmet-async'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Search, FileText, UserCheck, Store, MapPin, ClipboardCheck } from 'lucide-react'

// Sub-component for individual review cards
function ReviewCard({ item, type, onApprove, onReject, isPending }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col sm:flex-row gap-5 hover:shadow-md transition-shadow">
      
      {/* Icon & Status */}
      <div className="flex flex-col items-center gap-2 shrink-0">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 shadow-sm ${
           type === 'student-verification' ? 'bg-blue-50 border-blue-100 text-blue-500' :
           type === 'marketplace-ads' ? 'bg-purple-50 border-purple-100 text-purple-500' :
           'bg-orange-50 border-orange-100 text-orange-500'
        }`}>
           {type === 'student-verification' ? <UserCheck size={28} /> : type === 'marketplace-ads' ? <FileText size={28} /> : <Store size={28} />}
        </div>
        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Pending</span>
      </div>

      {/* Details Area */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
         
         {type === 'student-verification' && (
            <>
               <h3 className="text-lg font-bold text-gray-900 mb-1">{item.user?.full_name || 'User Verification'}</h3>
               <p className="text-sm text-gray-500 mb-2 flex items-center gap-1.5"><MapPin size={14}/> {item.university?.name || 'Unknown Campus'}</p>
               <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 border border-gray-100 inline-block">
                 <p><span className="font-semibold">Student ID:</span> {item.student_id || 'N/A'}</p>
                 <p><span className="font-semibold">Document:</span> <a href={item.id_card_url || item.document_url} target="_blank" rel="noreferrer" className="text-brand-primary hover:underline">View Attachment</a></p>
               </div>
            </>
         )}

         {type === 'marketplace-ads' && (
            <>
               <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{item.title}</h3>
               <p className="text-sm text-gray-500 mb-2">Posted by {item.user?.full_name}</p>
               <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 border border-gray-100 line-clamp-2">
                 {item.description}
               </div>
            </>
         )}

         {type === 'seller-applications' && (
            <>
               <h3 className="text-lg font-bold text-gray-900 mb-1">{item.store_name}</h3>
               <p className="text-sm text-gray-500 mb-2 flex items-center gap-1.5"><MapPin size={14}/> {item.campus_name || item.university?.name || 'Any Campus'}</p>
               <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 border border-gray-100 inline-block">
                 <p><span className="font-semibold">Applicant:</span> {item.user?.full_name}</p>
                 <p><span className="font-semibold">Business Plan:</span> {item.business_description || 'N/A'}</p>
                 {item.document_url && <p><span className="font-semibold">Document:</span> <a href={item.document_url} target="_blank" rel="noreferrer" className="text-brand-primary hover:underline">View Attachment</a></p>}
               </div>
            </>
         )}

      </div>

      {/* Action Buttons */}
      <div className="flex sm:flex-col justify-end gap-2 shrink-0 border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-4 mt-2 sm:mt-0">
        <Button 
           variant="outline" 
           className="border-green-600 text-green-700 hover:bg-green-50 shadow-sm gap-1.5 h-10 w-full"
           disabled={isPending}
           onClick={() => onApprove(item.id)}
        >
           <CheckCircle2 size={16} /> Approve
        </Button>
        <Button 
           variant="outline" 
           className="border-red-600 text-red-700 hover:bg-red-50 shadow-sm gap-1.5 h-10 w-full"
           disabled={isPending}
           onClick={() => onReject(item.id)}
        >
           <XCircle size={16} /> Reject
        </Button>
      </div>

    </div>
  )
}

export default function AdminApprovalsPage() {
  const queryClient = useQueryClient()
  const { isAdmin, isSellerModerator, isMarketplaceModerator } = useAuthStore()

  // Gatekeeping Tabs array based on the roles!
  const visibleTabs = [
    { id: 'student-verification', label: 'Student Verification', show: isAdmin() },
    { id: 'marketplace-ads',      label: 'Marketplace Ads',      show: isAdmin() || isMarketplaceModerator() },
    { id: 'seller-applications',  label: 'Seller Applications',  show: isAdmin() || isSellerModerator() },
  ].filter(t => t.show)

  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.id || '')

  // Queries map correctly when active
  const { data: listData, isLoading } = useQuery({
    queryKey: ['admin-approvals', activeTab],
    queryFn: async () => {
       if (activeTab === 'student-verification') return api.get('/admin/approvals/students/').then(r => r.data.data.results)
       if (activeTab === 'marketplace-ads')     return api.get('/admin/approvals/marketplace/').then(r => r.data.data.results)
       if (activeTab === 'seller-applications') return api.get('/admin/approvals/sellers/').then(r => r.data.data.results)
       return []
    },
    enabled: !!activeTab
  })

  // Action mutations
  const approveMutation = useMutation({
    mutationFn: (id: string) => {
       if (activeTab === 'student-verification') return api.post(`/admin/approvals/students/${id}/approve/`)
       if (activeTab === 'marketplace-ads')     return api.post(`/admin/approvals/marketplace/${id}/approve/`)
       return api.post(`/admin/approvals/sellers/${id}/approve/`) // seller-applications
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-approvals', activeTab] })
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: any) => {
       const payload = { reason: reason || 'Violation of terms.' }
       if (activeTab === 'student-verification') return api.post(`/admin/approvals/students/${id}/reject/`, payload)
       if (activeTab === 'marketplace-ads')     return api.post(`/admin/approvals/marketplace/${id}/reject/`, payload)
       return api.post(`/admin/approvals/sellers/${id}/reject/`, payload)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-approvals', activeTab] })
  })

  const handleApprove = (id: string) => {
    if (window.confirm('Are you sure you want to approve this item?')) {
      approveMutation.mutate(id)
    }
  }

  const handleReject = (id: string) => {
    const reason = window.prompt("Enter a reason for rejection (optional):")
    if (reason !== null) {
      rejectMutation.mutate({ id, reason })
    }
  }

  if (visibleTabs.length === 0) {
    return <div className="p-8 text-center text-gray-500">You do not have permission to review items.</div>
  }

  return (
    <>
      <Helmet><title>Pending Approvals | Admin Hub</title></Helmet>

      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Review Center</h1>
        <p className="text-gray-500 mt-1">Manage pending applications, verifications, and marketplace queue.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
         {/* Tabs Header */}
         <div className="flex overflow-x-auto gap-1 p-2 bg-gray-50/50 border-b border-gray-100 no-scrollbar">
            {visibleTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-bold rounded-xl whitespace-nowrap transition-all ${
                  activeTab === tab.id ? 'bg-white text-brand-primary shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
         </div>
         
         <div className="p-4 sm:p-6 bg-gray-50/20">
            {/* Search/Filter Bar */}
            <div className="relative w-full sm:max-w-md mb-6">
               <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
               <input type="text" placeholder={`Search ${visibleTabs.find(t=>t.id===activeTab)?.label}...`} className="w-full pl-10 pr-3 py-2 border rounded-xl outline-none focus:border-brand-primary text-sm shadow-sm" />
            </div>

            {/* List */}
            <div className="space-y-4">
              {isLoading ? (
                 Array.from({length: 3}).map((_, i) => <div key={i} className="h-32 bg-white border shadow-sm animate-pulse rounded-2xl" />)
              ) : !listData || listData.length === 0 ? (
                 <div className="bg-white rounded-2xl border p-12 text-center shadow-sm">
                    <ClipboardCheck size={48} className="mx-auto text-gray-300 mb-3" />
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Catching up complete!</h3>
                    <p className="text-gray-500">There are no pending items in this category at the moment.</p>
                 </div>
              ) : (
                 listData.map((item: any) => (
                   <ReviewCard 
                      key={item.id} 
                      type={activeTab} 
                      item={item} 
                      onApprove={handleApprove}
                      onReject={handleReject}
                      isPending={approveMutation.isPending || rejectMutation.isPending}
                   />
                 ))
              )}
            </div>
         </div>
      </div>
    </>
  )
}
