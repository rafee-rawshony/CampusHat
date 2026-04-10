import Link from 'next/link'
import { ShoppingBasket, Key, Bell, Utensils } from 'lucide-react'

const categories = [
    {
        title: 'Buy',
        subtitle: 'Items & Goods',
        icon: ShoppingBasket,
        bg: 'bg-purple-50',
        text: 'text-purple-800',
        border: 'border-purple-100',
        hoverBg: 'hover:bg-purple-100',
        href: '/marketplace/buy',
    },
    {
        title: 'Rental',
        subtitle: 'Housing & Tools',
        icon: Key,
        bg: 'bg-green-50',
        text: 'text-green-800',
        border: 'border-green-100',
        hoverBg: 'hover:bg-green-100',
        href: '/marketplace/rental',
    },
    {
        title: 'Services',
        subtitle: 'Tutoring & Jobs',
        icon: Bell,
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-100',
        hoverBg: 'hover:bg-blue-100',
        href: '/marketplace/services',
    },
    {
        title: 'Food',
        subtitle: 'Homemade Meals',
        icon: Utensils,
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        border: 'border-orange-100',
        hoverBg: 'hover:bg-orange-100',
        href: '/marketplace/food',
    },
]

export function CategoryCards() {
    return (
        <section>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 my-8">
                {categories.map((cat) => (
                    <Link
                        key={cat.href}
                        href={cat.href}
                        className={`p-4 md:p-8 ${cat.bg} ${cat.text} rounded-3xl text-center border ${cat.border} ${cat.hoverBg} hover:shadow-lg transition-all group`}
                    >
                        <cat.icon className="w-8 h-8 md:w-10 md:h-10 mx-auto group-hover:scale-110 transition-transform" />
                        <h3 className="text-lg md:text-2xl font-bold mt-4">{cat.title}</h3>
                        <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest mt-2 opacity-60">
                            {cat.subtitle}
                        </p>
                    </Link>
                ))}
            </div>
        </section>
    )
}
