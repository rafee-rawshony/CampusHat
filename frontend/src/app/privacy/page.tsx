'use client'

import Link from 'next/link'

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-12 pb-20 sm:pb-12">

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Privacy Policy</h1>
                    <p className="text-sm text-gray-400 mt-1 mb-8">Last updated: January 2025</p>

                    <p className="text-gray-600 leading-relaxed mb-6">
                        CampusHat ("we", "our", "us") is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights as a user.
                    </p>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">1. What We Collect</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">We collect information you provide directly and data generated through your use of the platform:</p>
                    <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                        <li>Account info: name, email address, student/faculty ID</li>
                        <li>Campus & institution details for campus-specific features</li>
                        <li>Order history, shipping addresses, and payment preferences</li>
                        <li>Device info and usage data (pages visited, actions taken)</li>
                    </ul>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">2. How We Use Your Data</h2>
                    <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                        <li>Process orders and manage your account</li>
                        <li>Personalise product recommendations and search results</li>
                        <li>Send order confirmations, updates, and support responses</li>
                        <li>Detect fraud and enforce our Terms of Service</li>
                        <li>Improve the platform through aggregated analytics</li>
                    </ul>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">3. Data Sharing</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        We do not sell your personal data to third parties. We share limited data only as necessary to operate the platform:
                    </p>
                    <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                        <li>Sellers receive your name and shipping address to fulfil orders</li>
                        <li>Payment processors receive transaction data (no raw card numbers stored on our servers)</li>
                        <li>We may disclose data if required by law or to protect user safety</li>
                    </ul>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">4. Cookies & Local Storage</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        We use cookies and browser local storage to keep you logged in, remember your cart, and measure platform performance. You can clear cookies at any time through your browser settings, though this may log you out.
                    </p>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">5. Your Rights</h2>
                    <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                        <li><strong>Access:</strong> Request a copy of the data we hold about you</li>
                        <li><strong>Correction:</strong> Update incorrect or incomplete information from your account settings</li>
                        <li><strong>Deletion:</strong> Request account deletion — we will remove your personal data within 30 days</li>
                        <li><strong>Portability:</strong> Export your order history from your account page</li>
                    </ul>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">6. Data Security</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        All data is transmitted over HTTPS. Passwords are hashed and never stored in plain text. We perform regular security audits and restrict access to personal data to authorised staff only.
                    </p>

                    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">7. Contact</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        For privacy-related questions or to exercise your rights, contact us at{' '}
                        <a href="mailto:privacy@campushat.com" className="text-[#4C3B8A] hover:underline">privacy@campushat.com</a>.
                    </p>
                </div>

                <div className="text-sm text-gray-500 text-center mt-6">
                    <Link href="/terms" className="text-[#4C3B8A] hover:underline font-medium">Terms of Service</Link>
                    {' · '}
                    <Link href="/help" className="text-[#4C3B8A] hover:underline font-medium">Help Center</Link>
                </div>
            </div>
        </div>
    )
}
