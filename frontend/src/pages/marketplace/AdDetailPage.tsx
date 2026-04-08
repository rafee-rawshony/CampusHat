import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import { Helmet } from 'react-helmet-async'
import { LazyImage } from '@/components/ui/LazyImage'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageSquare, Phone, MapPin, Tag, Calendar, User, Eye, AlertTriangle } from 'lucide-react'
import { useSwipe } from '@/hooks/useSwipe'
import { VerificationRequiredCard } from './components/VerificationRequiredCard'

export default function AdDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, canAccessMarketplace } = useAuthStore()
  
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [showVerCard, setShowVerCard] = useState(false)

  const { data: listing, isLoading } = useQuery({ 
    queryKey: ['listing', id], 
    queryFn: () => api.get(`/marketplace/listings/${id}/`).then(r => r.data.data),
    enabled: !!id
  })

  // Start chat mutation using Phase 01 spec
  const startChatMutation = useMutation({
    mutationFn: () => api.post(`/marketplace/listings/${listing.id}/start-chat/`),
    onSuccess: (res) => {
      navigate(`/marketplace/chat/${res.data.data.chat_session_id}`)
    }
  })

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => {
      if (listing?.images?.length > 1) {
        setActiveImageIndex(p => (p + 1) % listing.images.length)
      }
    },
    onSwipeRight: () => {
      if (listing?.images?.length > 1) {
        setActiveImageIndex(p => (p === 0 ? listing.images.length - 1 : p - 1))
      }
    }
  })

  const handleContact = () => {
    if (!canAccessMarketplace()) {
      setShowVerCard(true)
      return
    }
    // Prevent messaging self
    if (user?.id === listing?.user?.id) return
    startChatMutation.mutate()
  }

  if (isLoading) return <div className="min-h-screen py-20 text-center">Loading ad...</div>
  if (!listing) return <div className="min-h-screen py-20 text-center">Ad not found</div>

  const isOwner = user?.id === listing?.user?.id

  return (
    <>
      <Helmet><title>{listing.title} | Campus Marketplace</title></Helmet>
      
      <div className="bg-gray-50 min-h-screen pb-24 sm:pb-8">
        
        {/* Navigation */}
        <div className="bg-white border-b sticky top-0 sm:static z-30">
           <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                <ArrowLeft size={20} />
              </button>
              <span className="font-medium text-gray-900 truncate pr-4">{listing.title}</span>
           </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 pt-6">
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            
            {/* Image Gallery */}
            <div className="w-full bg-gray-100 relative group" {...swipeHandlers}>
              <div className="aspect-[4/3] md:aspect-[16/9] bg-black/5 relative overflow-hidden">
                 {listing.images && listing.images.length > 0 ? (
                   <LazyImage
                     src={listing.images[activeImageIndex]?.image_url}
                     alt={listing.title}
                     className="w-full h-full object-contain backdrop-blur-sm"
                   />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">
                     No Image Available
                   </div>
                 )}
                 {listing.condition && (
                   <div className="absolute top-4 left-4 bg-black/60 text-white font-medium text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                     {listing.condition}
                   </div>
                 )}
              </div>
              
              {/* Dot Indicators */}
              {listing.images?.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  {listing.images.map((_: any, idx: number) => (
                    <div key={idx} className={`w-2 h-2 rounded-full shadow-sm ${idx === activeImageIndex ? 'bg-white' : 'bg-white/50'}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="p-5 md:p-8 flex flex-col md:flex-row gap-8">
              
              <div className="flex-[2]">
                 <div className="mb-6 pb-6 border-b">
                    <div className="flex justify-between items-start mb-2">
                      <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                        {listing.title}
                      </h1>
                    </div>
                    <CurrencyDisplay amount={listing.price} className="text-3xl font-extrabold text-brand-primary mb-4 block" />
                    
                    <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5 opacity-80"><MapPin size={16}/> {listing.university?.name || 'Any Campus'}</div>
                      <div className="flex items-center gap-1.5 opacity-80"><Calendar size={16}/> {new Date(listing.created_at).toLocaleDateString()}</div>
                      <div className="flex items-center gap-1.5 opacity-80"><Eye size={16}/> {listing.views_count || 0} views</div>
                    </div>
                 </div>

                 <div className="mb-6 pb-6 border-b">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900"><Tag size={20} className="text-brand-primary" /> Details</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl">
                      <div className="flex flex-col"><span className="text-gray-500 text-xs">Type</span><span className="font-medium capitalize">{listing.post_type}</span></div>
                      <div className="flex flex-col"><span className="text-gray-500 text-xs">Condition</span><span className="font-medium">{listing.condition || '-'}</span></div>
                      {listing.category && <div className="flex flex-col"><span className="text-gray-500 text-xs">Category</span><span className="font-medium">{listing.category.name}</span></div>}
                      <div className="flex flex-col"><span className="text-gray-500 text-xs">Status</span><span className="font-medium capitalize text-green-600">{listing.status}</span></div>
                    </div>
                 </div>

                 <div>
                    <h2 className="text-lg font-bold mb-4 text-gray-900">Description</h2>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                      {listing.description}
                    </p>
                 </div>
              </div>

              {/* Seller Info Sidebar */}
              <div className="flex-1">
                 <div className="bg-gray-50 rounded-xl p-5 border md:sticky md:top-24">
                    <h3 className="font-bold text-gray-900 mb-4 pb-3 border-b">Seller Info</h3>
                    
                    <div className="flex items-center gap-4 mb-6">
                       <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-brand-primary/20 text-brand-primary shrink-0">
                         <User size={24} />
                       </div>
                       <div>
                          <p className="font-bold text-gray-900">{listing.user?.full_name || 'Student Seller'}</p>
                          <p className="text-xs text-brand-primary mt-0.5 font-medium bg-brand-primary/10 inline-block px-2 py-0.5 rounded-full">Verified Student</p>
                       </div>
                    </div>

                    {!isOwner ? (
                      <div className="flex flex-col gap-3">
                        <Button 
                          className="w-full h-12 font-bold shadow-md gap-2"
                          onClick={handleContact}
                          disabled={startChatMutation.isPending}
                        >
                          <MessageSquare size={18} /> 
                          {startChatMutation.isPending ? 'Connecting...' : 'Chat with Seller'}
                        </Button>
                        
                        {listing.contact_visible && listing.contact_phone ? (
                           <a href={`tel:${listing.contact_phone}`} className="flex items-center justify-center gap-2 w-full h-12 border-2 border-brand-primary text-brand-primary font-bold rounded-lg hover:bg-brand-primary/5 transition-colors">
                             <Phone size={18} /> Show Number
                           </a>
                        ) : (
                           <div className="text-center p-3 bg-gray-100 rounded-lg text-xs text-gray-500 font-medium">
                              Phone number hidden by seller.<br/>Please use chat.
                           </div>
                        )}

                        <div className="mt-4 pt-4 border-t flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                           <AlertTriangle size={14} /> Report this ad
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-brand-primary/10 text-brand-primary rounded-lg text-sm text-center font-bold">
                        This is your advertisement.
                      </div>
                    )}
                 </div>
              </div>

            </div>
          </div>
        </div>

        {/* Mobile Sticky Bottom Bar — Only shows if not owner */}
        {!isOwner && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t p-3 sm:hidden shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.1)] pb-[calc(12px+env(safe-area-inset-bottom))]">
            <div className="flex gap-3 max-w-md mx-auto">
               {listing.contact_visible && listing.contact_phone && (
                 <a href={`tel:${listing.contact_phone}`} className="flex-1 flex items-center justify-center border-2 border-brand-primary text-brand-primary rounded-lg font-bold hover:bg-brand-primary/5">
                   <Phone size={18} />
                 </a>
               )}
               <Button 
                 className={`h-12 font-bold flex gap-2 ${listing.contact_visible && listing.contact_phone ? 'flex-[3]' : 'flex-1 w-full'}`}
                 onClick={handleContact}
                 disabled={startChatMutation.isPending}
               >
                 <MessageSquare size={18} /> {startChatMutation.isPending ? '...' : 'Chat'}
               </Button>
            </div>
          </div>
        )}

        {showVerCard && <VerificationRequiredCard onDismiss={() => setShowVerCard(false)} />}
      </div>
    </>
  )
}
