import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import { Helmet } from 'react-helmet-async'
import { MessageSquare } from 'lucide-react'

export default function ChatPage() {
  const { user } = useAuthStore()

  const { data: chats, isLoading } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => api.get('/marketplace/chat/').then(r => r.data.data) // Assuming Phase 01 /chat/ returns list
  })

  // Format date correctly
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <>
      <Helmet><title>Messages | Campus Marketplace</title></Helmet>
      
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MessageSquare className="text-brand-primary" /> Messages
          </h1>

          {isLoading ? (
            <div className="space-y-3">
               {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-xl" />)}
            </div>
          ) : !chats || chats.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border shadow-sm text-center">
              <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-lg font-bold text-gray-900 mb-2">No messages yet</h2>
              <p className="text-gray-500 mb-6">When you contact a seller or someone replies to your ad, messages will appear here.</p>
              <Link to="/marketplace" className="bg-brand-primary text-white font-bold px-6 py-2.5 rounded-lg hover:bg-brand-primary/90 transition-colors">
                Browse Ads
              </Link>
            </div>
          ) : (
            <div className="bg-white border rounded-xl shadow-sm divide-y divide-gray-100 overflow-hidden">
              {chats.map((chat: any) => {
                 // Identify the OTHER user in the chat
                 const otherUser = chat.buyer?.id === user?.id ? chat.seller : chat.buyer
                 const isUnread = chat.unread_count > 0 && chat.last_message?.sender_id !== user?.id

                 return (
                  <Link
                    key={chat.id}
                    to={`/marketplace/chat/${chat.id}`}
                    className={`flex items-center gap-4 p-4 hover:bg-brand-primary/5 transition-colors relative ${isUnread ? 'bg-brand-primary/5' : ''}`}
                  >
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex shrink-0 items-center justify-center font-bold text-xl text-gray-400 border shadow-sm">
                      {otherUser?.full_name?.charAt(0) || 'U'}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`truncate font-bold text-base ${isUnread ? 'text-gray-900' : 'text-gray-800'}`}>
                          {otherUser?.full_name || 'Anonymous User'}
                        </h3>
                        {chat.last_message && (
                          <span className={`text-xs whitespace-nowrap ml-2 ${isUnread ? 'text-brand-primary font-bold' : 'text-gray-400'}`}>
                            {formatTime(chat.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                         <p className={`text-sm truncate pr-4 ${isUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                           {chat.last_message ? chat.last_message.content : `Ad: ${chat.listing?.title}`}
                         </p>
                         {isUnread && (
                           <div className="w-5 h-5 bg-brand-primary rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                             {chat.unread_count}
                           </div>
                         )}
                      </div>
                    </div>
                  </Link>
                 )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
