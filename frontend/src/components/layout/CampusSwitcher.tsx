'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Search, Building2, Globe, Plus, X, Loader2 } from 'lucide-react'
import { useCampusStore } from '@/stores/campus.store'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface Campus {
    id: string
    name: string
    short_name: string
}

const DIVISIONS = ['Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh']

export function CampusSwitcher() {
    const { selectedCampusId, setCampus, clearCampus } = useCampusStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [campuses, setCampuses] = useState<Campus[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState('')
    const [open, setOpen] = useState(false)
    const [showRequestForm, setShowRequestForm] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [requestForm, setRequestForm] = useState({
        name: '', division: '', district: '', website: '', requester_email: '', note: '',
    })

    const dropdownRef = useRef<HTMLDivElement>(null)
    const searchRef = useRef<HTMLInputElement>(null)

    const fetchCampuses = async () => {
        setIsLoading(true)
        setLoadError('')
        try {
            const res = await api.get('/universities/?page_size=1000')
            const raw = res.data?.data ?? res.data
            const results = Array.isArray(raw)
                ? raw
                : Array.isArray(raw?.results)
                    ? raw.results
                        : Array.isArray(res.data?.results)
                            ? res.data.results
                            : []

            if (Array.isArray(results)) {
                setCampuses(results.map((u: any) => ({
                    id: String(u.id),
                    name: u.name,
                    short_name: u.short_name || u.short_code || u.name.substring(0, 5)
                })))
            }
        } catch (err: any) {
            setCampuses([])
            setLoadError(err?.response?.data?.message || 'Could not load universities.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchCampuses()
    }, [])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false)
                setShowRequestForm(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    useEffect(() => {
        if (open && !showRequestForm) setTimeout(() => searchRef.current?.focus(), 100)
    }, [open, showRequestForm])

    // Split query into words — each word must appear somewhere in name or short_name
    const filtered = campuses.filter((c) => {
        const words = searchQuery.toLowerCase().split(/\s+/).filter(Boolean)
        if (words.length === 0) return true
        const haystack = (c.name + ' ' + c.short_name).toLowerCase()
        return words.every(word => haystack.includes(word))
    })

    const handleRequestSubmit = async () => {
        if (!requestForm.name.trim() || !requestForm.division || !requestForm.district.trim()) {
            toast.error('Please fill in university name, division and district.')
            return
        }
        setIsSubmitting(true)
        try {
            await api.post('/universities/requests/', {
                name: requestForm.name.trim(),
                division: requestForm.division,
                district: requestForm.district.trim(),
                website: requestForm.website.trim() || undefined,
                requester_email: requestForm.requester_email.trim() || undefined,
                note: requestForm.note.trim() || undefined,
            })
            toast.success('Request submitted! Our team will review it shortly.')
            setShowRequestForm(false)
            setRequestForm({ name: '', division: '', district: '', website: '', requester_email: '', note: '' })
        } catch (err: any) {
            const msg = err?.response?.data?.name?.[0] || err?.response?.data?.detail || 'Failed to submit request.'
            toast.error(msg)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => { setOpen(!open); setShowRequestForm(false) }}
                className={`bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg px-3 md:px-4 py-1.5 transition-all flex items-center gap-2 shadow-sm ${open ? 'bg-white/20 ring-2 ring-white/20' : ''}`}
            >
                <Building2 className="h-3 w-3 opacity-70" />
                <span className="text-[10px] md:text-xs font-extrabold uppercase tracking-tight text-white">Switch Campus</span>
                <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">

                    {/* ── Request Form ── */}
                    {showRequestForm ? (
                        <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-bold text-gray-800">Request to Add University</p>
                                <button onClick={() => setShowRequestForm(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <input
                                type="text"
                                placeholder="University full name *"
                                value={requestForm.name}
                                onChange={e => setRequestForm(f => ({ ...f, name: e.target.value }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A]"
                            />

                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={requestForm.division}
                                    onChange={e => setRequestForm(f => ({ ...f, division: e.target.value }))}
                                    className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-white"
                                >
                                    <option value="">Division *</option>
                                    {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <input
                                    type="text"
                                    placeholder="District *"
                                    value={requestForm.district}
                                    onChange={e => setRequestForm(f => ({ ...f, district: e.target.value }))}
                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A]"
                                />
                            </div>

                            <input
                                type="url"
                                placeholder="Website (optional)"
                                value={requestForm.website}
                                onChange={e => setRequestForm(f => ({ ...f, website: e.target.value }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A]"
                            />

                            <input
                                type="email"
                                placeholder="Your email (optional)"
                                value={requestForm.requester_email}
                                onChange={e => setRequestForm(f => ({ ...f, requester_email: e.target.value }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A]"
                            />

                            <textarea
                                placeholder="Any additional notes (optional)"
                                value={requestForm.note}
                                onChange={e => setRequestForm(f => ({ ...f, note: e.target.value }))}
                                rows={2}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] resize-none"
                            />

                            <button
                                onClick={handleRequestSubmit}
                                disabled={isSubmitting}
                                className="w-full bg-[#4C3B8A] hover:bg-[#3d2e6e] text-white text-sm font-semibold py-2 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Submit Request
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Search */}
                            <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                    <input
                                        ref={searchRef}
                                        type="text"
                                        placeholder="Find your university..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#4C3B8A] outline-none text-gray-800 font-medium"
                                    />
                                </div>
                            </div>

                            {/* Options */}
                            <div className="max-h-56 overflow-y-auto p-2">
                                <button
                                    onClick={() => { clearCampus(); setOpen(false); setSearchQuery('') }}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors mb-1 ${!selectedCampusId ? 'bg-purple-50 text-[#4C3B8A] font-bold' : 'text-gray-600 hover:bg-gray-50 font-semibold'}`}
                                >
                                    <Globe className="inline-block w-4 h-4 mr-2 opacity-50" /> All Campuses (Global)
                                </button>
                                <div className="h-px bg-gray-100 my-1 mx-2" />
                                {filtered.map((campus) => {
                                    const logoSrc = `https://placehold.co/40x40/4C3B8A/ffffff?text=${encodeURIComponent(campus.short_name.substring(0, 3))}`
                                    const isSelected = String(selectedCampusId) === campus.id
                                    return (
                                        <button
                                            key={campus.id}
                                            onClick={() => { setCampus(campus.id, campus.name); setOpen(false); setSearchQuery('') }}
                                            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-3 ${isSelected ? 'bg-purple-50 text-[#4C3B8A] font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={logoSrc} alt="" className="w-7 h-7 rounded-lg shrink-0 object-cover" />
                                            <span className="leading-tight">{campus.name}</span>
                                        </button>
                                    )
                                })}

                                {isLoading && (
                                    <div className="px-4 py-6 text-center">
                                        <p className="text-gray-400 text-xs font-bold">Loading universities...</p>
                                    </div>
                                )}
                                {!isLoading && loadError && (
                                    <div className="px-4 py-6 text-center">
                                        <p className="text-red-500 text-xs font-bold">{loadError}</p>
                                        <button
                                            onClick={fetchCampuses}
                                            className="mt-2 text-[11px] font-semibold text-[#4C3B8A] hover:underline"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                )}
                                {!isLoading && !loadError && filtered.length === 0 && campuses.length > 0 && (
                                    <div className="px-4 py-6 text-center">
                                        <p className="text-gray-500 text-xs font-bold">No results found</p>
                                        <p className="text-gray-400 text-xs mt-1">Can&apos;t find your university?</p>
                                    </div>
                                )}
                                {!isLoading && !loadError && campuses.length === 0 && (
                                    <div className="px-4 py-6 text-center">
                                        <p className="text-gray-500 text-xs font-bold">No universities available yet</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer — request to add */}
                            <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                                <button
                                    onClick={() => setShowRequestForm(true)}
                                    className="w-full flex items-center justify-center gap-2 text-xs text-[#4C3B8A] font-semibold hover:bg-purple-50 py-2 rounded-xl transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Can&apos;t find your university? Request to add
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
