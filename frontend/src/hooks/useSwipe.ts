import { useRef, useCallback } from 'react'

interface SwipeHandlers {
    onSwipeLeft?: () => void
    onSwipeRight?: () => void
    onSwipeUp?: () => void
    onSwipeDown?: () => void
}

interface SwipeOptions {
    threshold?: number
}

export function useSwipe(handlers: SwipeHandlers, options?: SwipeOptions) {
    const threshold = options?.threshold ?? 50
    const startX = useRef(0)
    const startY = useRef(0)

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX
        startY.current = e.touches[0].clientY
    }, [])

    const onTouchEnd = useCallback((e: React.TouchEvent) => {
        const endX = e.changedTouches[0].clientX
        const endY = e.changedTouches[0].clientY
        const dx = endX - startX.current
        const dy = endY - startY.current

        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > threshold) handlers.onSwipeRight?.()
            else if (dx < -threshold) handlers.onSwipeLeft?.()
        } else {
            if (dy > threshold) handlers.onSwipeDown?.()
            else if (dy < -threshold) handlers.onSwipeUp?.()
        }
    }, [handlers, threshold])

    return { onTouchStart, onTouchEnd }
}
