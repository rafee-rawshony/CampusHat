'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircleQuestion, Send, CheckCircle2, User, Store, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ProductQATabProps {
    productSlug: string
}

interface Question {
    id: string
    asker_name: string
    question: string
    answer: string | null
    answerer_name: string | null
    answered_at: string | null
    vote_count: number
    created_at: string
}

function timeAgo(dateStr: string): string {
    const now = Date.now()
    const then = new Date(dateStr).getTime()
    const seconds = Math.floor((now - then) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return new Date(dateStr).toLocaleDateString('en-BD', { dateStyle: 'medium' })
}

export function ProductQATab({ productSlug }: ProductQATabProps) {
    const { isAuthenticated } = useAuthStore()
    const queryClient = useQueryClient()
    const [newQuestion, setNewQuestion] = useState('')
    const [searchQuery, setSearchQuery] = useState('')

    const { data: questions = [], isLoading } = useQuery({
        queryKey: ['product-qa', productSlug],
        queryFn: async () => {
            const res = await api.get(`/mall/products/${productSlug}/questions/`)
            return res.data?.data || []
        },
        enabled: !!productSlug,
    })

    const askMutation = useMutation({
        mutationFn: async (questionText: string) => {
            const res = await api.post(`/mall/products/${productSlug}/questions/`, {
                question: questionText,
            })
            return res.data
        },
        onSuccess: () => {
            setNewQuestion('')
            queryClient.invalidateQueries({ queryKey: ['product-qa', productSlug] })
            toast.success('Question submitted!')
        },
        onError: () => {
            toast.error('Failed to submit question.')
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newQuestion.trim()) return
        if (!isAuthenticated) {
            toast.error('Please login to ask a question.')
            return
        }
        askMutation.mutate(newQuestion.trim())
    }

    const filteredQuestions: Question[] = searchQuery
        ? questions.filter((q: Question) =>
            q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (q.answer && q.answer.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : questions

    return (
        <div className="space-y-6">
            {/* Ask a Question */}
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-2xl p-5">
                <p className="text-sm font-bold text-gray-900 mb-3">Ask a Question</p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        placeholder={isAuthenticated ? "What would you like to know about this product?" : "Login to ask a question..."}
                        disabled={!isAuthenticated}
                        maxLength={500}
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4C3B8A]/30 focus:border-[#4C3B8A] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <Button
                        type="submit"
                        disabled={!isAuthenticated || !newQuestion.trim() || askMutation.isPending}
                        className="bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white rounded-xl px-4"
                    >
                        {askMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </form>

            {/* Search Questions */}
            {questions.length > 3 && (
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search questions..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4C3B8A]/30"
                />
            )}

            {/* Questions List */}
            {isLoading ? (
                <div className="py-12 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                </div>
            ) : filteredQuestions.length === 0 ? (
                <div className="py-12 text-center">
                    <MessageCircleQuestion className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-base font-semibold text-gray-900">No questions yet</p>
                    <p className="text-sm text-gray-500 mt-1">Be the first to ask about this product!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredQuestions.map((q: Question) => (
                        <div key={q.id} className="border border-gray-100 rounded-2xl overflow-hidden">
                            {/* Question */}
                            <div className="p-4 bg-white">
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                                        <User className="w-3.5 h-3.5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-gray-900">{q.asker_name}</span>
                                            <span className="text-[10px] text-gray-400 font-medium">{timeAgo(q.created_at)}</span>
                                        </div>
                                        <p className="text-sm text-gray-800">{q.question}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Answer */}
                            {q.answer && (
                                <div className="px-4 py-3 bg-emerald-50/50 border-t border-gray-100">
                                    <div className="flex items-start gap-3">
                                        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                            <Store className="w-3.5 h-3.5 text-emerald-700" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-emerald-800">{q.answerer_name || 'Seller'}</span>
                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                {q.answered_at && (
                                                    <span className="text-[10px] text-emerald-600/60 font-medium">{timeAgo(q.answered_at)}</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-emerald-900">{q.answer}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Unanswered badge */}
                            {!q.answer && (
                                <div className="px-4 py-2 bg-amber-50/50 border-t border-gray-100">
                                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Awaiting seller response</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Question count */}
            {questions.length > 0 && (
                <p className="text-xs text-gray-400 text-center font-medium">
                    {questions.length} question{questions.length !== 1 ? 's' : ''} total
                </p>
            )}
        </div>
    )
}
