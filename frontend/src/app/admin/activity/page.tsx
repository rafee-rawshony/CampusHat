'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'



import { CodeSquare } from 'lucide-react'

export default function AdminActivityPage() {
    const { isAdmin } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        if (!isAdmin()) {
            router.replace('/admin/approvals')
        }
    }, [isAdmin, router])

    return (
        <div className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto flex flex-col h-full items-center justify-center">
            <div className="flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <CodeSquare className="w-16 h-16 mb-4 opacity-20" />
                <h1 className="text-2xl font-black text-gray-900 mb-2">Activity Logs</h1>
                <p className="font-medium max-w-md">Detailed system and moderator activity logging will be implemented in a future update.</p>
            </div>
        </div>
    )
}
