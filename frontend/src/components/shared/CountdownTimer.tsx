'use client'

import { useState, useEffect } from 'react'

interface CountdownTimerProps {
    targetDate: string
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    })

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(targetDate) - +new Date()

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                })
            }
        }

        const timer = setInterval(calculateTimeLeft, 1000)
        calculateTimeLeft()

        return () => clearInterval(timer)
    }, [targetDate])

    const formatNumber = (num: number) => num.toString().padStart(2, '0')

    const Cell = ({ value, label }: { value: number | string; label: string }) => (
        <div className="flex flex-col items-center min-w-[40px]">
            <span className="font-bold text-base sm:text-lg text-[#4C3B8A] leading-none tabular-nums">
                {value}
            </span>
            <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-wide">{label}</span>
        </div>
    )

    return (
        <div className="flex items-center gap-3 sm:gap-4">
            <Cell value={timeLeft.days} label="Days" />
            <Cell value={formatNumber(timeLeft.hours)} label="Hours" />
            <Cell value={formatNumber(timeLeft.minutes)} label="Minutes" />
            <Cell value={formatNumber(timeLeft.seconds)} label="Seconds" />
        </div>
    )
}
