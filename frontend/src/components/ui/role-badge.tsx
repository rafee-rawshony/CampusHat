import { Badge } from '@/components/ui/badge'
import { CheckCircle, Store, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'

type RoleType = 'student' | 'faculty' | 'seller' | 'official_store'

interface RoleBadgeProps {
    role: RoleType
    className?: string
}

const roleConfig: Record<RoleType, { label: string; icon: React.ElementType; className: string }> = {
    student: {
        label: 'Verified Student',
        icon: GraduationCap,
        className: 'bg-brand-light text-brand-primary',
    },
    faculty: {
        label: 'Verified Faculty',
        icon: CheckCircle,
        className: 'bg-brand-light text-brand-primary',
    },
    seller: {
        label: 'Student Seller',
        icon: Store,
        className: 'bg-marketplace-buy/10 text-marketplace-buy',
    },
    official_store: {
        label: 'Official Store',
        icon: Store,
        className: 'bg-badge-instock/10 text-badge-instock',
    },
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
    const config = roleConfig[role]
    const Icon = config.icon

    return (
        <Badge variant="outline" className={cn(config.className, 'gap-1 border-none', className)}>
            <Icon className="h-3 w-3" />
            {config.label}
        </Badge>
    )
}
