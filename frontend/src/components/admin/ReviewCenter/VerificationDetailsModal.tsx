import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { X, Mail, Phone, User, GraduationCap, Building2, Calendar, FileText } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

interface VerificationDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    verification: any
}

export function VerificationDetailsModal({ isOpen, onClose, verification }: VerificationDetailsModalProps) {
    if (!verification) return null

    const user = verification.user || {}
    const createdDate = verification.created_at ? new Date(verification.created_at).toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'
    
    // Formatting verification type
    const formatType = (type: string) => {
        if (!type) return 'Unknown'
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }

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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white rounded-2xl border-0 shadow-2xl max-h-[90vh] flex flex-col">
                <DialogHeader className="p-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="text-xl font-bold text-gray-900">Verification Request Details</DialogTitle>
                        <p className="text-sm text-gray-500 mt-1">Review the user&apos;s information before making a decision.</p>
                    </div>
                    <DialogClose className="rounded-full p-2 hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </DialogClose>
                </DialogHeader>

                <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    
                    {/* User Profile Section */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <User className="w-4 h-4 text-[#4C3B8A]" /> 
                            Applicant Information
                        </h3>
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-4 mb-4 border-b border-gray-100 pb-4">
                                <Avatar className="w-16 h-16 border border-gray-200 shadow-sm">
                                    <AvatarImage src={user.profile_picture} />
                                    <AvatarFallback className="bg-gray-100 text-gray-600 text-lg">
                                        {getInitials(user.full_name || 'U')}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="font-bold text-lg text-gray-900">{user.full_name || 'Unknown Name'}</h4>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 mt-1">
                                        {formatType(verification.verification_type)} Request
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                                <InfoRow icon={Mail} label="Personal Email" value={user.email} />
                                <InfoRow icon={Phone} label="Phone Number" value={user.phone} />
                            </div>
                        </div>
                    </section>

                    {/* Academic Information Section */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-[#4C3B8A]" /> 
                            Academic Details
                        </h3>
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                                <InfoRow icon={Building2} label="University" value={user.university_name || user.university_short_code} />
                                <InfoRow icon={User} label="Student/Faculty ID" value={verification.student_id_number} />
                                <InfoRow icon={Mail} label="University Email" value={user.university_email} />
                            </div>
                        </div>
                    </section>

                    {/* Request Details Section */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#4C3B8A]" /> 
                            Request Info
                        </h3>
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                                <InfoRow icon={Calendar} label="Submitted On" value={createdDate} />
                                <InfoRow 
                                    icon={FileText} 
                                    label="Status" 
                                    value={
                                        <span className="capitalize px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                                            {verification.status}
                                        </span>
                                    } 
                                />
                            </div>
                        </div>
                    </section>
                    
                </div>
            </DialogContent>
        </Dialog>
    )
}
