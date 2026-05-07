interface ResourceBadgeProps {
    resourceType: string
}

export function ResourceBadge({ resourceType }: ResourceBadgeProps) {
    const formatName = (type: string) => {
        return type.replace(/_/g, ' ').toUpperCase()
    }

    return (
        <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider">
            {formatName(resourceType)}
        </span>
    )
}
