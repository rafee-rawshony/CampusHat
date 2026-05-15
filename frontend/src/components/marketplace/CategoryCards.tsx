import Link from 'next/link'
import { ShoppingBasket, Key, Bell, Utensils } from 'lucide-react'

const categories = [
    {
        title: 'Buy',
        subtitle: 'Items & Goods',
        icon: ShoppingBasket,
        bg: 'bg-purple-50',
        iconBg: 'bg-purple-100',
        text: 'text-purple-800',
        iconColor: 'text-purple-600',
        border: 'border-purple-100/80',
        hoverBorder: 'hover:border-purple-200',
        hoverShadow: 'hover:shadow-purple-100/60',
        href: '/marketplace/buy',
    },
    {
        title: 'Rental',
        subtitle: 'Housing & Tools',
        icon: Key,
        bg: 'bg-emerald-50',
        iconBg: 'bg-emerald-100',
        text: 'text-emerald-800',
        iconColor: 'text-emerald-600',
        border: 'border-emerald-100/80',
        hoverBorder: 'hover:border-emerald-200',
        hoverShadow: 'hover:shadow-emerald-100/60',
        href: '/marketplace/rental',
    },
    {
        title: 'Services',
        subtitle: 'Tutoring & Jobs',
        icon: Bell,
        bg: 'bg-blue-50',
        iconBg: 'bg-blue-100',
        text: 'text-blue-800',
        iconColor: 'text-blue-600',
        border: 'border-blue-100/80',
        hoverBorder: 'hover:border-blue-200',
        hoverShadow: 'hover:shadow-blue-100/60',
        href: '/marketplace/services',
    },
    {
        title: 'Food',
        subtitle: 'Homemade Meals',
        icon: Utensils,
        bg: 'bg-orange-50',
        iconBg: 'bg-orange-100',
        text: 'text-orange-800',
        iconColor: 'text-orange-600',
        border: 'border-orange-100/80',
        hoverBorder: 'hover:border-orange-200',
        hoverShadow: 'hover:shadow-orange-100/60',
        href: '/marketplace/food',
    },
]

export function CategoryCards() {
    return (
        <section>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 my-4 sm:my-8">
                {categories.map((cat) => (
                    <Link
                        key={cat.href}
                        href={cat.href}
                        className={`p-4 sm:p-5 md:p-8 ${cat.bg} ${cat.text} rounded-2xl md:rounded-3xl text-center border ${cat.border} ${cat.hoverBorder} ${cat.hoverShadow} hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 group`}
                    >
                        <div className={`w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 ${cat.iconBg} rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300`}>
                            <cat.icon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ${cat.iconColor}`} />
                        </div>
                        <h3 className="text-base sm:text-lg md:text-2xl font-bold mt-2.5 sm:mt-4">{cat.title}</h3>
                        <p className="text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider sm:tracking-widest mt-1 sm:mt-2 opacity-50">
                            {cat.subtitle}
                        </p>
                    </Link>
                ))}
            </div>
        </section>
    )
}
