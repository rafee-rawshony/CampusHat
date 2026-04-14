export const getInitials = (name: string): string => {
    if (!name) return 'User'
    return name.split(' ')
               .map(n => n[0])
               .join('')
               .toUpperCase()
               .slice(0, 2)
  }
