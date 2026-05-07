import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Condition = 'new' | 'like_new' | 'good' | 'fair' | 'poor'

const conditionConfig: Record<Condition, { label: string; className: string }> = {
    new: { label: 'NEW', className: 'bg-badge-instock text-white' },
    like_new: { label: 'USED - LIKE NEW', className: 'bg-emerald-100 text-emerald-800' },
    good: { label: 'USED - GOOD', className: 'bg-blue-100 text-blue-800' },
    fair: { label: 'USED - FAIR', className: 'bg-amber-100 text-amber-800' },
    poor: { label: 'USED - POOR', className: 'bg-red-100 text-red-800' },
}

interface ConditionBadgeProps {
    condition: Condition
    className?: string
}

export function ConditionBadge({ condition, className }: ConditionBadgeProps) {
    const config = conditionConfig[condition]
    return (
        <Badge variant="outline" className={cn(config.className, 'border-none', className)}>
            {config.label}
        </Badge>
    )
}
