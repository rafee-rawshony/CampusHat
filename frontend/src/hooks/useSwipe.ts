import { useRef, useState } from 'react'

interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
}

export function useSwipe({ onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50 }: SwipeHandlers) {
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const [swiping, setSwiping] = useState(false)

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    setSwiping(true)
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > threshold) onSwipeRight?.()
      if (dx < -threshold) onSwipeLeft?.()
    } else {
      if (dy > threshold) onSwipeDown?.()
      if (dy < -threshold) onSwipeUp?.()
    }
    touchStart.current = null
    setSwiping(false)
  }

  return { onTouchStart, onTouchEnd, swiping }
}
