'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, Clock } from 'lucide-react'

export function ExplorerSearchBar() {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    // Read starting query from URL
    const initialQuery = searchParams.get('q') || ''
    const [query, setQuery] = useState(initialQuery)
    const [isFocused, setIsFocused] = useState(false)
    const [recentSearches, setRecentSearches] = useState<string[]>([])
    const debounceRef = useRef<NodeJS.Timeout | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Load recent searches
    useEffect(() => {
        try {
            const saved = localStorage.getItem('recent_searches')
            if (saved) {
                setRecentSearches(JSON.parse(saved))
            }
        } catch (e) {
            console.error('Failed to parse recent searches', e)
        }
        
        // Auto-focus if no query on load
        if (!initialQuery && inputRef.current) {
            inputRef.current.focus()
        }
    }, [initialQuery])

    // Handle outside query changes (e.g. user clears filter from pill)
    useEffect(() => {
        if (searchParams.get('q') !== query) {
            setQuery(searchParams.get('q') || '')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams.get('q')])

    const updateUrlParams = (newQuery: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (newQuery) {
            params.set('q', newQuery)
        } else {
            params.delete('q')
        }
        // Reset to page 1 on new search
        params.delete('page') 
        router.replace(`/marketplace/explorer?${params.toString()}`, { scroll: false })
    }

    const saveRecentSearch = (term: string) => {
        if (!term || term.trim().length === 0) return
        const normalized = term.trim()
        const newSearches = [normalized, ...recentSearches.filter(s => s !== normalized)].slice(0, 5)
        setRecentSearches(newSearches)
        localStorage.setItem('recent_searches', JSON.stringify(newSearches))
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setQuery(val)

        // Debounce URL update
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            updateUrlParams(val)
        }, 400)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (debounceRef.current) clearTimeout(debounceRef.current)
            updateUrlParams(query)
            saveRecentSearch(query)
            setIsFocused(false) // Close suggestions
            inputRef.current?.blur()
        }
    }

    const clearSearch = () => {
        setQuery('')
        if (debounceRef.current) clearTimeout(debounceRef.current)
        updateUrlParams('')
        inputRef.current?.focus()
    }

    const handleSuggestionClick = (suggestion: string) => {
        setQuery(suggestion)
        updateUrlParams(suggestion)
        saveRecentSearch(suggestion)
        setIsFocused(false)
    }

    const clearHistory = () => {
        setRecentSearches([])
        localStorage.removeItem('recent_searches')
    }

    const showSuggestions = isFocused && query.length >= 2 && recentSearches.length > 0

    return (
        <div className="max-w-2xl mx-auto w-full mb-6 relative">
            <div className={`flex items-center bg-white border ${isFocused ? 'border-[#4C3B8A] ring-1 ring-[#4C3B8A]' : 'border-gray-300'} rounded-xl px-4 py-3 gap-3 shadow-sm transition-all`}>
                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)} // delay to allow clicks on dropdown
                    placeholder="Search listings — books, furniture, tutoring..."
                    className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                />

                {query && (
                    <button onClick={clearSearch} className="text-gray-400 hover:text-gray-600 focus:outline-none p-1">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="p-2">
                        {recentSearches.filter(s => s.toLowerCase().includes(query.toLowerCase())).length > 0 ? (
                            recentSearches
                                .filter(s => s.toLowerCase().includes(query.toLowerCase()))
                                .map((term, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSuggestionClick(term)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span className="flex-1 text-sm">{term}</span>
                                    </button>
                                ))
                        ) : (
                            <p className="px-3 py-2 text-sm text-gray-500">No recent matches</p>
                        )}
                    </div>
                    {recentSearches.length > 0 && (
                        <div className="bg-gray-50 border-t border-gray-100 px-4 py-2 flex justify-end">
                            <button onClick={clearHistory} className="text-xs text-[#4C3B8A] hover:underline font-medium">
                                Clear history
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Helper Text below search bar */}
            {!query && (
                <p className="text-sm text-gray-400 text-center mt-2">Showing all recent listings</p>
            )}
            {query && (
                <p className="text-sm text-gray-500 text-center mt-2">Showing results for <span className="font-semibold text-gray-700">'{query}'</span></p>
            )}
        </div>
    )
}
