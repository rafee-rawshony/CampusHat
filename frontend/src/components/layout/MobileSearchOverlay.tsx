'use client'
import { useState, useRef, useEffect } from 'react'
import { Search, ArrowLeft, X, Clock, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

// Since we removed zustand persist store useModeStore in earlier steps maybe, let's check it. I'll rely on pathname instead.
import { usePathname } from 'next/navigation'

export function MobileSearchOverlay({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const mode = pathname?.startsWith('/marketplace') ? 'marketplace' : 'mall'

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
      const saved = JSON.parse(localStorage.getItem('recent-searches')||'[]')
      setRecentSearches(saved)
    } else {
      setQuery('')
      setResults([])
    }
  }, [open])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      const endpoint = mode === 'marketplace'
        ? '/marketplace/listings/'
        : '/mall/products/'
      try {
        const res = await api.get(endpoint, { params:{search:query,page_size:5} })
        // Safe access because page_size or results might not match exactly.
        const d = res.data?.results || res.data?.data?.results || res.data || []
        setResults(Array.isArray(d) ? d : [])
      } catch (e) {
          setResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, mode])

  const handleSearch = (q = query) => {
    if (!q.trim()) return
    const recent = [q, ...recentSearches.filter(s=>s!==q)].slice(0,5)
    localStorage.setItem('recent-searches', JSON.stringify(recent))
    const path = mode==='marketplace' ? '/marketplace' : '/shop'
    router.push(`${path}?q=${encodeURIComponent(q)}`)
    onClose()
  }

  if (!open) return null

  return (
    <div className='fixed inset-0 z-50 bg-white flex flex-col'>
      {/* HEADER */}
      <div className='flex items-center gap-3 p-3 border-b'>
        <button onClick={onClose} className='p-2'>
          <ArrowLeft className='w-5 h-5' />
        </button>
        <div className='flex-1 relative'>
            <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleSearch()}
            placeholder='Search...'
            className='w-full text-base outline-none bg-gray-100 rounded-lg px-4 py-2' />
            {query && (
            <button onClick={()=>setQuery('')} className='absolute right-2 top-1/2 -translate-y-1/2 p-2'>
                <X className='w-4 h-4 text-gray-400' />
            </button>
            )}
        </div>
        <button onClick={onClose}
          className='text-brand-primary font-semibold text-sm px-2'>
          Cancel
        </button>
      </div>
      {/* CONTENT */}
      <div className='flex-1 overflow-y-auto p-4'>
        {!query && recentSearches.length > 0 && (
          <div>
            <p className='text-xs font-bold text-gray-400 uppercase mb-3'>
              Recent Searches
            </p>
            {recentSearches.map(s => (
              <button key={s} onClick={()=>handleSearch(s)}
                className='flex items-center gap-3 w-full py-3 border-b border-gray-50
                           text-left text-gray-700 font-medium'>
                <Clock className='w-4 h-4 text-gray-400' />
                <span className='flex-1'>{s}</span>
              </button>
            ))}
          </div>
        )}
        {results.length > 0 && query && results.map(item => (
          <button key={item.id}
            onClick={()=>handleSearch(query)}
            className='flex items-center gap-3 w-full py-3 border-b text-left border-gray-50'>
            <Search className='w-4 h-4 text-gray-400 shrink-0' />
            <span className='text-gray-700 line-clamp-1 font-medium'>
              {item.name || item.title}
            </span>
          </button>
        ))}
        {query && (
          <button onClick={()=>handleSearch()}
            className='mt-4 text-brand-primary text-sm font-bold w-full p-3 rounded-lg bg-brand-light/10 text-center hover:bg-brand-light/20 transition-colors'>
            See all results for "{query}"
          </button>
        )}
      </div>
    </div>
  )
}
