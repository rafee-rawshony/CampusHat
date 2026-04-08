import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface CountdownTimerProps {
  targetDate: Date
  className?: string
}

export function CountdownTimer({ targetDate, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft())

  function getTimeLeft() {
    const diff = Math.max(0, targetDate.getTime() - Date.now())
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    }
  }

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  return (
    <div className={cn('flex items-center gap-1 font-mono text-sm', className)}>
      <span className="bg-brand-primary text-white px-1.5 py-0.5 rounded">{String(timeLeft.days).padStart(2, '0')}</span>:
      <span className="bg-brand-primary text-white px-1.5 py-0.5 rounded">{String(timeLeft.hours).padStart(2, '0')}</span>:
      <span className="bg-brand-primary text-white px-1.5 py-0.5 rounded">{String(timeLeft.minutes).padStart(2, '0')}</span>:
      <span className="bg-brand-primary text-white px-1.5 py-0.5 rounded">{String(timeLeft.seconds).padStart(2, '0')}</span>
    </div>
  )
}
