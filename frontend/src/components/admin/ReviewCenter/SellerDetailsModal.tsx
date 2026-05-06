import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { X, ExternalLink, MapPin, Phone, Mail, Store, User, CreditCard } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import Image from 'next/image'

interface SellerDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    seller: any
}

export function SellerDetailsModal({ isOpen, onClose, seller }: SellerDetailsModalProps) {
    if (!seller) return null

    const user = seller.user || {}
    const store = seller.store || {}
    const bankDetails = seller.bank_details_decrypted || {}
    const mobileMethod = seller.mobile_banking_method
    const mobileNumber = seller.mobile_number_decrypted

    const InfoRow = ({ label, value, icon: Icon }: any) => {
        if (!value) return null
        return (
            <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                {Icon && <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />}
                <div>
                    <div className="text-xs text-gray-500 font-medium mb-0.5">{label}</div>
                    <div className="text-sm font-semibold text-gray-900">{value}</div>
                </div>
            </div>
        )
    }

    const DocumentLink = ({ label, url }: { label: string, url?: string }) => {
        if (!url) return null
        return (
            <a 
                href={url} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors group"
            >
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#4C3B8A]" />
            </a>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white rounded-2xl border-0 shadow-2xl max-h-[90vh] flex flex-col">
                <DialogHeader className="p-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="text-xl font-bold text-gray-900">Seller Application Details</DialogTitle>
                        <p className="text-sm text-gray-500 mt-1">Review the provided information carefully before approving.</p>
                    </div>
                    <DialogClose className="rounded-full p-2 hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </DialogClose>
                </DialogHeader>

                <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    
                    {/* User Profile Section */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <User className="w-4 h-4 text-[#4C3B8A]" /> 
                            Applicant Information
                        </h3>
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-4 mb-4">
                                <Avatar className="w-16 h-16 border border-gray-200 shadow-sm">
                                    <AvatarImage src={user.profile_picture} />
                                    <AvatarFallback className="bg-gray-100 text-gray-600 text-lg">
                                        {getInitials(user.full_name || 'U')}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="font-bold text-lg text-gray-900">{user.full_name || 'Unknown Name'}</h4>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 mt-1">
                                        {seller.is_student_seller ? 'Verified Student Seller' : 'Individual Seller'}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                                <InfoRow icon={Mail} label="Email Address" value={user.email} />
                                <InfoRow icon={Phone} label="Phone Number" value={user.phone} />
                                <InfoRow icon={User} label="NID/Passport Number" value={seller.nid_number_decrypted || seller.nid_number} />
                            </div>
                        </div>
                    </section>

                    {/* Store Information Section */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Store className="w-4 h-4 text-[#4C3B8A]" /> 
                            Store Details
                        </h3>
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                            <div className="flex gap-4 items-start">
                                {store.logo ? (
                                    <div className="w-20 h-20 relative rounded-lg overflow-hidden border border-gray-200 shrink-0">
                                        <Image src={store.logo} alt="Store Logo" fill className="object-cover" unoptimized />
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
                                        <Store className="w-8 h-8 text-gray-300" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h4 className="font-bold text-lg text-gray-900">{store.name || 'Unnamed Store'}</h4>
                                    <p className="text-sm text-gray-500 mt-1 mb-2">
                                        {store.description || 'No description provided.'}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {store.store_category && (
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
                                                {store.store_category}
                                            </span>
                                        )}
                                        {store.store_type && (
                                            <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded capitalize">
                                                {store.store_type} Store
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 pt-2 border-t border-gray-100">
                                <InfoRow icon={Mail} label="Business Email" value={seller.business_email} />
                                <InfoRow icon={Phone} label="Business Phone" value={seller.business_phone} />
                            </div>
                        </div>
                    </section>

                    {/* Financial Information */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-[#4C3B8A]" /> 
                            Financial & Payout Details
                        </h3>
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-100 pb-2">Bank Account</h4>
                                {bankDetails?.account_number ? (
                                    <div className="space-y-1">
                                        <InfoRow label="Bank Name" value={bankDetails.bank_name} />
                                        <InfoRow label="Account Name" value={bankDetails.account_name} />
                                        <InfoRow label="Account Number" value={bankDetails.account_number} />
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">No bank account provided.</p>
                                )}
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-100 pb-2">Mobile Banking</h4>
                                {mobileNumber ? (
                                    <div className="space-y-1">
                                        <InfoRow label="Provider" value={mobileMethod?.toUpperCase()} />
                                        <InfoRow label="Account Number" value={mobileNumber} />
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">No mobile banking provided.</p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Documents */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Store className="w-4 h-4 text-[#4C3B8A]" /> 
                            Verification Documents
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            <DocumentLink label="Identity Document (Front)" url={seller.nid_front_url} />
                            <DocumentLink label="Identity Document (Back)" url={seller.nid_back_url} />
                            <DocumentLink label="Trade License" url={seller.trade_license_url} />
                            <DocumentLink label="TIN Certificate" url={seller.tin_cert_url} />
                            <DocumentLink label="VAT Certificate" url={seller.vat_cert_url} />
                            <DocumentLink label="Brand Auth Letter" url={seller.brand_auth_letter_url} />
                            <DocumentLink label="Trademark Certificate" url={seller.trademark_cert_url} />
                        </div>
                        {!seller.nid_front_url && !seller.trade_license_url && (
                            <p className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                                No verification documents were uploaded.
                            </p>
                        )}
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    )
}
