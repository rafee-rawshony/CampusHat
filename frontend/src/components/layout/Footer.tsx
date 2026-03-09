import Link from 'next/link'
import { Separator } from '@/components/ui/separator'

const footerSections = [
    {
        title: 'Support & Help',
        links: [
            { label: 'Help Center', href: '/help' },
            { label: 'FAQs', href: '/faqs' },
            { label: 'Contact Us', href: '/contact' },
            { label: 'Report Issue', href: '/report' },
        ],
    },
    {
        title: 'Partnerships',
        links: [
            { label: 'Become a Seller', href: '/auth/register?seller=true' },
            { label: 'University Partners', href: '/partners' },
            { label: 'Advertise', href: '/advertise' },
            { label: 'Affiliates', href: '/affiliates' },
        ],
    },
    {
        title: 'Customer Care',
        links: [
            { label: 'Order Tracking', href: '/orders' },
            { label: 'Returns & Refunds', href: '/returns' },
            { label: 'Shipping Info', href: '/shipping' },
            { label: 'Privacy Policy', href: '/privacy' },
        ],
    },
    {
        title: 'Connect with Us',
        links: [
            { label: 'Facebook', href: '#' },
            { label: 'Instagram', href: '#' },
            { label: 'Twitter', href: '#' },
            { label: 'LinkedIn', href: '#' },
        ],
    },
]

export function Footer() {
    return (
        <footer className="bg-brand-accent text-white mt-12">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {footerSections.map((section) => (
                        <div key={section.title}>
                            <h3 className="font-semibold text-sm mb-4 uppercase tracking-wider text-white/60">
                                {section.title}
                            </h3>
                            <ul className="space-y-3">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-white/70 hover:text-white transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <Separator className="my-8 bg-white/10" />
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center">
                        <span className="text-lg font-bold text-brand-primary">Campus</span>
                        <span className="text-lg font-bold text-white">Hat</span>
                    </div>
                    <p className="text-sm text-white/50">
                        © {new Date().getFullYear()} CampusHat. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}
