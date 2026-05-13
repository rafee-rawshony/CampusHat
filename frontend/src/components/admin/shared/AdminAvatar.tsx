import Image from 'next/image'
import { getInitials } from '@/lib/initials'
import { hashColor } from '@/lib/hashColor'

interface AdminAvatarProps {
    user: {
        full_name: string
        profile_picture?: string | null
    }
    size?: 'sm' | 'md' | 'lg'
}

export function AdminAvatar({ user, size = 'md' }: AdminAvatarProps) {
    const sizeClasses = {
        sm: 'w-5 h-5 text-[10px]',
        md: 'w-7 h-7 text-xs',
        lg: 'w-10 h-10 text-sm'
    }

    const { full_name = 'Unknown', profile_picture } = user || {}
    const initials = getInitials(full_name)
    const bgColor = hashColor(full_name)

    return (
        <div className={`relative rounded-full overflow-hidden shrink-0 flex items-center justify-center text-white font-bold ${bgColor} flex-shrink-0 ${sizeClasses[size]}`}>
            {profile_picture ? (
                <Image 
                    src={profile_picture} 
                    alt={full_name} 
                    fill 
                    unoptimized
                    className="object-cover" 
                />
            ) : (
                <span>{initials}</span>
            )}
        </div>
    )
}
