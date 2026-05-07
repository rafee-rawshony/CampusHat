'use client'

import Link from 'next/link'

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-4 py-12">

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                    <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
                    <p className="text-sm text-gray-400 mt-1 mb-8">Last updated: January 2025</p>

                    <p className="text-gray-600 leading-relaxed mb-6">
                        By accessing or using the CampusHat platform, you agree to be bound by these Terms of Service. Please read them carefully before using the platform.
                    </p>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">1. Acceptance of Terms</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        By registering an account or using any part of CampusHat, you confirm that you are at least 16 years of age and agree to these terms. If you are using the platform on behalf of an institution, you represent that you have authority to bind that institution.
                    </p>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">2. Description of Services</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        CampusHat operates two distinct systems: the <strong>Mall</strong> (formal retail by verified sellers) and the <strong>Marketplace</strong> (peer-to-peer ads between campus members). Both are available to registered users who belong to an affiliated campus or institution.
                    </p>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">3. User Accounts</h2>
                    <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                        <li>You are responsible for maintaining the confidentiality of your login credentials</li>
                        <li>You must provide accurate information during registration</li>
                        <li>One person may not maintain multiple active accounts</li>
                        <li>You must notify us immediately of any unauthorised use of your account</li>
                    </ul>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">4. Marketplace Rules</h2>
                    <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                        <li>Listings must accurately describe the item's condition and price</li>
                        <li>All listings are subject to admin approval and may be removed without notice</li>
                        <li>Sellers are responsible for the accuracy of product descriptions and images</li>
                        <li>CampusHat does not guarantee the quality of peer-to-peer transactions</li>
                    </ul>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">5. Payment Terms</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        All prices are displayed in Bangladeshi Taka (৳). CampusHat deducts a commission from each completed sale before disbursing to the seller. Commission rates are set by the platform and may change with notice. Payouts require a minimum balance as configured in platform settings.
                    </p>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">6. Prohibited Activities</h2>
                    <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                        <li>Listing counterfeit, stolen, or illegal items</li>
                        <li>Harassing, threatening, or impersonating other users</li>
                        <li>Attempting to manipulate reviews or ratings</li>
                        <li>Scraping, reverse-engineering, or interfering with platform systems</li>
                        <li>Conducting transactions outside the platform to avoid fees</li>
                    </ul>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">7. Limitation of Liability</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        CampusHat is a marketplace platform and is not liable for disputes between buyers and sellers, item quality, or delivery delays. Our liability for any claim is limited to the amount paid for the transaction in question. We are not liable for indirect, incidental, or consequential damages.
                    </p>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">8. Governing Law</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        These terms are governed by the laws of the People's Republic of Bangladesh. Any disputes shall be resolved in the courts of Dhaka, Bangladesh.
                    </p>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">9. Contact</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        For questions about these terms, email{' '}
                        <a href="mailto:legal@campushat.com" className="text-[#4C3B8A] hover:underline">legal@campushat.com</a>.
                    </p>
                </div>

                <div className="text-sm text-gray-500 text-center mt-6">
                    <Link href="/privacy" className="text-[#4C3B8A] hover:underline font-medium">Privacy Policy</Link>
                    {' · '}
                    <Link href="/help" className="text-[#4C3B8A] hover:underline font-medium">Help Center</Link>
                </div>
            </div>
        </div>
    )
}
