'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function MallChatRedirect() {
    const router = useRouter()
    const params = useParams()
    const chatId = params?.id as string

    useEffect(() => {
        router.replace(`/marketplace/chat/${chatId}`)
    }, [router, chatId])

    return null
}
