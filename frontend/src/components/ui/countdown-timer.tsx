'use client'

import { useState, useEffect } from 'react'

interface CountdownTimerProps {
    endsAt: Date
    className?: string
}

interface TimeLeft {
    days: number
    hours: number
    minutes: number
    seconds: number
}

function getTimeLeft(endsAt: Date): TimeLeft | null {
    const diff = endsAt.getTime() - Date.now()
    if (diff <= 0) return null
    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
    }
}

export function CountdownTimer({ endsAt, className }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(getTimeLeft(endsAt))

    useEffect(() => {
        const interval = setInterval(() => {
            const tl = getTimeLeft(endsAt)
            setTimeLeft(tl)
            if (!tl) clearInterval(interval)
        }, 1000)
        return () => clearInterval(interval)
    }, [endsAt])

    if (!timeLeft) return null

    const segments = [
        { label: 'Days', value: timeLeft.days },
        { label: 'Hrs', value: timeLeft.hours },
        { label: 'Min', value: timeLeft.minutes },
        { label: 'Sec', value: timeLeft.seconds },
    ]

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {segments.map((seg, i) => (
                <div key={seg.label} className="flex items-center">
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-brand-primary bg-brand-light rounded px-1.5 py-0.5 min-w-[28px] text-center tabular-nums">
                            {String(seg.value).padStart(2, '0')}
                        </span>
                        <span className="text-[9px] text-muted-foreground mt-0.5">{seg.label}</span>
                    </div>
                    {i < segments.length - 1 && (
                        <span className="text-muted-foreground font-bold mx-0.5 mb-3">:</span>
                    )}
                </div>
            ))}
        </div>
    )
}
