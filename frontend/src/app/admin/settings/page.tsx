'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import {
    Shield, Bell, Globe,
    Lock, CreditCard, ChevronRight, Save, Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'

// Settings sections configuration
const SECTIONS = [
    {
        id: 'general',
        label: 'General',
        icon: Globe,
        description: 'Platform name, logo, and basic settings',
    },
    {
        id: 'commission',
        label: 'Commission & Fees',
        icon: CreditCard,
        description: 'Platform commission rates and fee structure',
    },
    {
        id: 'security',
        label: 'Security',
        icon: Lock,
        description: 'Authentication, session, and security settings',
    },
    {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        description: 'Email templates and notification preferences',
    },
    {
        id: 'roles',
        label: 'Roles & Permissions',
        icon: Shield,
        description: 'Manage admin roles and moderator permissions',
    },
]

export default function AdminSettingsPage() {
    const { isAdmin } = useAuthStore()
    const router = useRouter()
    const [activeSection, setActiveSection] = useState('general')
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        if (!isAdmin()) router.replace('/admin/approvals')
    }, [isAdmin, router])

    // Simulated settings state
    const [settings, setSettings] = useState({
        platform_name: 'CampusHat',
        support_email: 'support@campushat.com',
        maintenance_mode: false,
        mall_commission: '10',
        marketplace_fee: '5',
        min_payout_amount: '500',
        max_login_attempts: '5',
        session_timeout: '60',
        require_email_verification: true,
        require_student_verification: true,
        email_new_order: true,
        email_refund_request: true,
        email_seller_application: true,
        push_enabled: false,
    })

    const handleChange = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }))
        setSaved(false)
    }

    const handleSave = () => {
        // In production, this would call an API to save settings
        toast.success('Settings saved successfully.')
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
    }

    if (!isAdmin()) return null

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-bold text-2xl text-gray-900 tracking-tight">Platform Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Configure platform-wide settings and preferences.</p>
                </div>
                <Button
                    onClick={handleSave}
                    className="bg-[#4C3B8A] hover:bg-[#3d2e6e] text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"
                >
                    {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? 'Saved' : 'Save Changes'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sidebar navigation */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-24">
                        {SECTIONS.map(section => {
                            const Icon = section.icon
                            const isActive = activeSection === section.id
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-l-[3px] ${
                                        isActive
                                            ? 'bg-[#4C3B8A]/5 border-[#4C3B8A] text-[#4C3B8A]'
                                            : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                    }`}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${isActive ? 'text-[#4C3B8A]' : ''}`}>{section.label}</p>
                                        <p className="text-[11px] text-gray-400 truncate hidden lg:block">{section.description}</p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Settings content */}
                <div className="lg:col-span-9 space-y-6">
                    {/* GENERAL */}
                    {activeSection === 'general' && (
                        <SettingsCard title="General Settings" description="Basic platform configuration">
                            <SettingsField label="Platform Name" description="The name displayed across the platform">
                                <Input
                                    value={settings.platform_name}
                                    onChange={e => handleChange('platform_name', e.target.value)}
                                    className="max-w-sm"
                                />
                            </SettingsField>
                            <SettingsField label="Support Email" description="Primary contact email for support">
                                <Input
                                    type="email"
                                    value={settings.support_email}
                                    onChange={e => handleChange('support_email', e.target.value)}
                                    className="max-w-sm"
                                />
                            </SettingsField>
                            <SettingsField label="Maintenance Mode" description="Temporarily disable the platform for maintenance">
                                <ToggleSwitch
                                    enabled={settings.maintenance_mode}
                                    onChange={v => handleChange('maintenance_mode', v)}
                                />
                            </SettingsField>
                        </SettingsCard>
                    )}

                    {/* COMMISSION */}
                    {activeSection === 'commission' && (
                        <SettingsCard title="Commission & Fees" description="Platform revenue configuration">
                            <SettingsField label="Mall Commission Rate (%)" description="Commission percentage on mall product sales">
                                <Input
                                    type="number"
                                    value={settings.mall_commission}
                                    onChange={e => handleChange('mall_commission', e.target.value)}
                                    className="max-w-[200px]"
                                    min="0" max="100"
                                />
                            </SettingsField>
                            <SettingsField label="Marketplace Listing Fee (%)" description="Fee charged for marketplace ad listings">
                                <Input
                                    type="number"
                                    value={settings.marketplace_fee}
                                    onChange={e => handleChange('marketplace_fee', e.target.value)}
                                    className="max-w-[200px]"
                                    min="0" max="100"
                                />
                            </SettingsField>
                            <SettingsField label="Minimum Payout Amount (৳)" description="Minimum balance required for seller payout">
                                <Input
                                    type="number"
                                    value={settings.min_payout_amount}
                                    onChange={e => handleChange('min_payout_amount', e.target.value)}
                                    className="max-w-[200px]"
                                    min="0"
                                />
                            </SettingsField>
                        </SettingsCard>
                    )}

                    {/* SECURITY */}
                    {activeSection === 'security' && (
                        <SettingsCard title="Security Settings" description="Authentication and access control">
                            <SettingsField label="Max Login Attempts" description="Number of failed attempts before temporary lockout">
                                <Input
                                    type="number"
                                    value={settings.max_login_attempts}
                                    onChange={e => handleChange('max_login_attempts', e.target.value)}
                                    className="max-w-[200px]"
                                    min="1" max="20"
                                />
                            </SettingsField>
                            <SettingsField label="Session Timeout (minutes)" description="Auto-logout after inactivity">
                                <Input
                                    type="number"
                                    value={settings.session_timeout}
                                    onChange={e => handleChange('session_timeout', e.target.value)}
                                    className="max-w-[200px]"
                                    min="5"
                                />
                            </SettingsField>
                            <SettingsField label="Require Email Verification" description="Users must verify their email to access features">
                                <ToggleSwitch
                                    enabled={settings.require_email_verification}
                                    onChange={v => handleChange('require_email_verification', v)}
                                />
                            </SettingsField>
                            <SettingsField label="Require Student Verification" description="Student ID verification for campus features">
                                <ToggleSwitch
                                    enabled={settings.require_student_verification}
                                    onChange={v => handleChange('require_student_verification', v)}
                                />
                            </SettingsField>
                        </SettingsCard>
                    )}

                    {/* NOTIFICATIONS */}
                    {activeSection === 'notifications' && (
                        <SettingsCard title="Notification Settings" description="Control which notifications are sent">
                            <SettingsField label="New Order Email" description="Send email to seller when a new order is placed">
                                <ToggleSwitch
                                    enabled={settings.email_new_order}
                                    onChange={v => handleChange('email_new_order', v)}
                                />
                            </SettingsField>
                            <SettingsField label="Refund Request Email" description="Notify admin when a refund is requested">
                                <ToggleSwitch
                                    enabled={settings.email_refund_request}
                                    onChange={v => handleChange('email_refund_request', v)}
                                />
                            </SettingsField>
                            <SettingsField label="Seller Application Email" description="Notify admin of new seller applications">
                                <ToggleSwitch
                                    enabled={settings.email_seller_application}
                                    onChange={v => handleChange('email_seller_application', v)}
                                />
                            </SettingsField>
                            <SettingsField label="Push Notifications" description="Enable browser push notifications for admins">
                                <ToggleSwitch
                                    enabled={settings.push_enabled}
                                    onChange={v => handleChange('push_enabled', v)}
                                />
                            </SettingsField>
                        </SettingsCard>
                    )}

                    {/* ROLES */}
                    {activeSection === 'roles' && (
                        <SettingsCard title="Roles & Permissions" description="Manage admin and moderator roles">
                            <div className="space-y-3">
                                {[
                                    { name: 'Super Admin', description: 'Full access to all platform features', color: 'bg-red-50 text-red-700' },
                                    { name: 'Admin', description: 'Manage all content, users, and orders', color: 'bg-purple-50 text-purple-700' },
                                    { name: 'Moderator', description: 'Review and approve content', color: 'bg-blue-50 text-blue-700' },
                                    { name: 'Seller Moderator', description: 'Manage seller applications and stores', color: 'bg-green-50 text-green-700' },
                                    { name: 'Marketplace Moderator', description: 'Review marketplace ads and reports', color: 'bg-orange-50 text-orange-700' },
                                ].map(role => (
                                    <div key={role.name} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                                        <span className={`px-3 py-1.5 text-xs font-bold rounded-lg ${role.color}`}>
                                            {role.name}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-600">{role.description}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-300" />
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-4">
                                Role permissions are managed through the Django admin backend. Contact the system administrator for changes.
                            </p>
                        </SettingsCard>
                    )}
                </div>
            </div>
        </div>
    )
}

// Settings card wrapper
function SettingsCard({ title, description, children }: {
    title: string; description: string; children: React.ReactNode
}) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="mb-6">
                <h2 className="font-semibold text-gray-900 text-lg">{title}</h2>
                <p className="text-sm text-gray-400 mt-0.5">{description}</p>
            </div>
            <div className="space-y-6">{children}</div>
        </div>
    )
}

// Individual settings field
function SettingsField({ label, description, children }: {
    label: string; description: string; children: React.ReactNode
}) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-gray-50 last:border-0">
            <div className="sm:max-w-[300px]">
                <p className="text-sm font-medium text-gray-700">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            </div>
            <div>{children}</div>
        </div>
    )
}

// Toggle switch component
function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (_enabled: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enabled ? 'bg-[#4C3B8A]' : 'bg-gray-200'
            }`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
        </button>
    )
}
