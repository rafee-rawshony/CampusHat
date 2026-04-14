// Deterministic color from string (for user avatars)
const COLORS = [
    'bg-purple-500','bg-blue-500','bg-green-500',
    'bg-orange-500','bg-pink-500','bg-teal-500',
    'bg-red-500','bg-indigo-500','bg-cyan-500',
  ]

  export const hashColor = (str: string): string => {
    if (!str) return COLORS[0]
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return COLORS[Math.abs(hash) % COLORS.length]
  }
