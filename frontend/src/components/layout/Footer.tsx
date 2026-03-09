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
        <footer className="bg-gray-100 mt-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
                {/* Newsletter */}
                <div className="bg-white p-8 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-center mb-12">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Join our newsletter for campus news</h3>
                        <p className="text-gray-500 mt-1 text-sm">Register now to get latest updates on tech promos & student events.</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex w-full md:w-auto max-w-md">
                        <input type="email" placeholder="Enter your email address" className="flex-grow border border-gray-300 rounded-l-md p-3 focus:ring-brand-primary focus:border-brand-primary focus:outline-none" />
                        <button className="bg-brand-primary text-white font-bold px-6 rounded-r-md hover:bg-brand-dark transition-colors">SUBSCRIBE</button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {footerSections.map((section) => (
                        <div key={section.title}>
                            <h4 className="font-bold text-gray-800 mb-4 tracking-wider">
                                {section.title}
                            </h4>
                            <ul className="space-y-3">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-gray-600 hover:text-brand-primary transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Copyright and Payment */}
                <Separator className="my-8 bg-gray-200" />
                <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                    <p className="mb-4 md:mb-0 text-center md:text-left">
                        © {new Date().getFullYear()} CampusHat Team. All rights reserved.
                    </p>

                    <div className="flex items-center bg-white px-4 py-2 rounded-md shadow-sm border border-gray-200 mb-4 md:mb-0">
                        <span className="text-xs font-bold text-gray-400 mr-3 uppercase tracking-wider">Secured by</span>
                        <span className="font-bold text-[#f58220]">SSL</span><span className="font-bold text-[#00a651]">Commerz</span>
                    </div>

                    <div className="flex space-x-6">
                        <Link href="/terms" className="hover:text-brand-primary transition-colors">Terms and Conditions</Link>
                        <Link href="/privacy" className="hover:text-brand-primary transition-colors">Privacy Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
