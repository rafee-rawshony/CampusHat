export const getInitials = (name?: string | null): string => {
    const safeName = typeof name === 'string' ? name.trim() : ''
    if (!safeName) return 'U'

    return safeName
        .split(/\s+/)
        .map(n => n[0])
        .filter(Boolean)
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U'
}
