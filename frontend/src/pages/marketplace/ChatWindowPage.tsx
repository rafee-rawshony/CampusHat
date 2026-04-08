import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import { Helmet } from 'react-helmet-async'
import { ArrowLeft, Send, Image as ImageIcon, Loader2, MessageSquare } from 'lucide-react'

export default function ChatWindowPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  const [messages, setMessages] = useState<any[]>([])
  const [inputText, setInputText] = useState('')
  const [isWsConnected, setIsWsConnected] = useState(false)
  
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Fetch session details (to show header, but messages come from WS or initial load via API if needed)
  // For Phase 03, we'll assume the API provides basic session info and past messages
  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ['chat-session', id],
    queryFn: () => api.get(`/marketplace/chat/${id}/`).then(r => r.data.data),
    enabled: !!id
  })

  // Set initial messages if provided by API
  useEffect(() => {
    if (session?.messages) {
      setMessages(session.messages)
    }
  }, [session])

  // Native WebSocket setup
  useEffect(() => {
    if (!id) return

    // Usually VITE_WS_URL looks like ws://localhost:8000
    const wsUrl = `${import.meta.env.VITE_WS_URL}/ws/chat/${id}/`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket Connected')
      setIsWsConnected(true)
    }

    ws.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data)
        // Expected payload: { message: 'hi', sender_id: 123, created_at: '...' }
        setMessages(prev => [...prev, payload])
      } catch (err) {
        console.error("Failed to parse incoming WS message:", err)
      }
    }

    ws.onclose = () => {
      console.log('WebSocket Disconnected')
      setIsWsConnected(false)
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [id])

  // Scroll to bottom magically when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    const payload = {
      content: inputText.trim(),
    }
    
    // Send via WebSocket (Django Channels expects JSON string)
    wsRef.current.send(JSON.stringify(payload))
    setInputText('')
  }

  // Format time for bubbles
  const formatTime = (isoString?: string) => {
    if (!isoString) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (isSessionLoading) return <div className="h-[100dvh] flex items-center justify-center"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>
  if (!session) return <div className="h-[100dvh] flex items-center justify-center">Chat session not found</div>

  const otherUser = session.buyer?.id === user?.id ? session.seller : session.buyer

  return (
    <>
      <Helmet><title>Chat with {otherUser?.full_name || 'Seller'} | CampusHat</title></Helmet>
      
      {/* 100dvh ensures virtual keyboards on mobile don't overlap layout! */}
      <div className="flex flex-col bg-gray-50" style={{ height: '100dvh' }}>
        
        {/* Header - Fixed Height */}
        <header className="shrink-0 h-14 bg-white border-b flex items-center px-4 gap-3 z-10 shadow-sm relative">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-brand-primary rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="w-9 h-9 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary font-bold shadow-inner">
               {otherUser?.full_name?.charAt(0) || 'U'}
             </div>
             <div className="flex flex-col justify-center min-w-0">
               <h2 className="font-bold text-gray-900 text-sm truncate leading-tight">{otherUser?.full_name || 'Anonymous User'}</h2>
               <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-green-500' : 'bg-red-500'} shadow-sm`} />
                  <span className="text-xs text-gray-500 font-medium">{isWsConnected ? 'Active' : 'Disconnected'}</span>
               </div>
             </div>
          </div>

          {/* Listing shortcut */}
          {session.listing && (
            <Link to={`/marketplace/listings/${session.listing.id}`} className="ml-auto hidden sm:flex items-center gap-2 bg-gray-50 rounded-lg p-1.5 border hover:bg-gray-100 transition-colors max-w-[150px]">
              <img src={session.listing.images?.[0]?.image_url || '/placeholder.png'} className="w-8 h-8 rounded shrink-0 object-cover" alt="" />
              <span className="text-xs font-semibold text-gray-700 truncate pr-1">{session.listing.title}</span>
            </Link>
          )}
        </header>

        {/* Message Area - Flex 1 & Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative bg-[#f8f9fa]">
          {messages.length === 0 && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 opacity-50">
                <MessageSquare size={48} className="text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 font-medium">Say hello pointing clearly to the ad!</p>
             </div>
          )}
          
          {messages.map((msg, idx) => {
             const isMe = msg.sender_id === user?.id
             return (
               <div key={msg.id || idx} className={`flex flex-col w-full ${isMe ? 'items-end' : 'items-start'}`}>
                 <div 
                   className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm relative ${
                     isMe 
                       ? 'bg-brand-primary text-white rounded-br-sm' 
                       : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
                   }`}
                 >
                   <p className="text-[15px] leading-snug whitespace-pre-wrap word-break-words break-words">{msg.content}</p>
                 </div>
                 <span className="text-[10px] text-gray-400 mt-1 px-1 font-medium select-none">
                   {formatTime(msg.created_at)}
                 </span>
               </div>
             )
          })}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar - Fixed at bottom safely checking safe-area-inset for iOS home indicator */}
        <div className="shrink-0 bg-white border-t p-3 pb-[max(12px,env(safe-area-inset-bottom))] drop-shadow-[0_-4px_6px_rgba(0,0,0,0.02)] relative z-10">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2 max-w-4xl mx-auto relative">
             
             <button type="button" className="p-3 text-gray-400 hover:text-brand-primary transition-colors shrink-0 rounded-full hover:bg-gray-50">
               <ImageIcon size={22} />
             </button>
             
             <div className="flex-1 bg-gray-100 rounded-2xl border border-transparent focus-within:border-brand-primary/30 focus-within:bg-white transition-all overflow-hidden flex">
               <textarea 
                 value={inputText}
                 onChange={(e) => setInputText(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     handleSendMessage(e);
                   }
                 }}
                 placeholder="Type a message..."
                 className="w-full bg-transparent border-none outline-none resize-none px-4 py-3 min-h-[46px] max-h-[120px] text-[15px] block no-scrollbar"
                 rows={1}
                 disabled={!isWsConnected}
               />
             </div>
             
             <button 
               type="submit" 
               disabled={!inputText.trim() || !isWsConnected}
               className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all shadow-sm ${
                 inputText.trim() && isWsConnected 
                   ? 'bg-brand-primary text-white hover:bg-brand-primary/90 hover:scale-105 shadow-brand-primary/30 rotate-0' 
                   : 'bg-gray-100 text-gray-400 cursor-not-allowed rotate-12'
               }`}
             >
               <Send size={20} className={inputText.trim() && isWsConnected ? 'ml-1' : ''} />
             </button>
          </form>
        </div>

      </div>
    </>
  )
}
