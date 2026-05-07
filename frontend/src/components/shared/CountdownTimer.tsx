'use client'

import { useState, useEffect } from 'react'

interface CountdownTimerProps {
    targetDate: string
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0
    })

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(targetDate) - +new Date()

            if (difference > 0) {
                setTimeLeft({
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

    return (
        <div className="flex gap-2">
            <div className="bg-red-500 text-white font-bold px-2 py-1 rounded text-sm">
                {formatNumber(timeLeft.hours)}
            </div>
            <span className="text-red-500 font-bold self-center">:</span>
            <div className="bg-red-500 text-white font-bold px-2 py-1 rounded text-sm">
                {formatNumber(timeLeft.minutes)}
            </div>
            <span className="text-red-500 font-bold self-center">:</span>
            <div className="bg-red-500 text-white font-bold px-2 py-1 rounded text-sm">
                {formatNumber(timeLeft.seconds)}
            </div>
        </div>
    )
}
