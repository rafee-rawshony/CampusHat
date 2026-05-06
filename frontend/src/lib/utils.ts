import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
    return `৳${amount.toLocaleString('en-BD')}`
}

export function getDiscountPercentage(original: number, current: number): number {
    return Math.round(((original - current) / original) * 100)
}

export function getInitials(name?: string | null): string {
    const safeName = typeof name === 'string' ? name.trim() : ''
    if (!safeName) return 'U'

    return safeName
        .split(/\s+/)
        .map((n) => n[0])
        .filter(Boolean)
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U'
}

export function truncate(str: string, length: number): string {
    if (str.length <= length) return str
    return str.slice(0, length) + '...'
}

export function timeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return `${seconds}s ago`
    
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    
    const months = Math.floor(days / 30)
    if (months < 12) return `${months}mo ago`
    
    const years = Math.floor(months / 12)
    return `${years}y ago`
}
