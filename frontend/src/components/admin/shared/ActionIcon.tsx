import { 
    CheckCircle, XCircle, Ban, RefreshCw, 
    Plus, Pencil, Trash2, LogIn, Activity 
} from 'lucide-react'

interface ActionIconProps {
    actionType: string
    size?: number
    className?: string
}

export function ActionIcon({ actionType, size = 16, className = '' }: ActionIconProps) {
    switch (actionType.toLowerCase()) {
        case 'approve':
            return <CheckCircle size={size} className={`text-green-500 ${className}`} />
        case 'reject':
            return <XCircle size={size} className={`text-red-500 ${className}`} />
        case 'suspend':
            return <Ban size={size} className={`text-red-500 ${className}`} />
        case 'activate':
            return <RefreshCw size={size} className={`text-green-500 ${className}`} />
        case 'create':
            return <Plus size={size} className={`text-blue-500 ${className}`} />
        case 'update':
            return <Pencil size={size} className={`text-amber-500 ${className}`} />
        case 'delete':
            return <Trash2 size={size} className={`text-red-400 ${className}`} />
        case 'login':
            return <LogIn size={size} className={`text-gray-400 ${className}`} />
        case 'other':
        default:
            return <Activity size={size} className={`text-gray-400 ${className}`} />
    }
}
