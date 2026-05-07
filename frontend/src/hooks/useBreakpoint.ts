import { useState, useEffect } from 'react'

const BREAKPOINTS = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
} as const

type Breakpoint = keyof typeof BREAKPOINTS

export function useBreakpoint() {
    const [width, setWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1024
    )

    useEffect(() => {
        const onResize = () => setWidth(window.innerWidth)
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [])

    const isMobile = width < BREAKPOINTS.md
    const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg
    const isDesktop = width >= BREAKPOINTS.lg

    const isAbove = (bp: Breakpoint) => width >= BREAKPOINTS[bp]
    const isBelow = (bp: Breakpoint) => width < BREAKPOINTS[bp]

    return { width, isMobile, isTablet, isDesktop, isAbove, isBelow }
}
