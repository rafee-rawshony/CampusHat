import { Helmet } from 'react-helmet-async'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', password_confirm: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.password_confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      await api.post('/auth/register/', { full_name: formData.full_name, email: formData.email, password: formData.password, password_confirm: formData.password_confirm })
      toast.success('Account created! Please verify your email.')
      navigate('/auth/verify-email')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <>
      <Helmet><title>Sign Up | CampusHat</title></Helmet>
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-brand-primary rounded-2xl mx-auto flex items-center justify-center mb-4"><GraduationCap size={28} className="text-white" /></div>
            <h1 className="text-2xl font-extrabold text-gray-900">Create an account</h1>
            <p className="text-gray-500 text-sm mt-1">Join the CampusHat community</p>
          </div>
          <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-surface-border shadow-sm space-y-4">
            <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label><input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required className="w-full px-4 py-2.5 border border-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary bg-surface-muted" /></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="w-full px-4 py-2.5 border border-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary bg-surface-muted" /></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label><input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required className="w-full px-4 py-2.5 border border-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary bg-surface-muted" /></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label><input type="password" value={formData.password_confirm} onChange={e => setFormData({...formData, password_confirm: e.target.value})} required className="w-full px-4 py-2.5 border border-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary bg-surface-muted" /></div>
            <Button type="submit" disabled={loading} className="w-full bg-brand-primary hover:bg-brand-dark text-white font-bold py-2.5 rounded-xl">{loading ? 'Creating...' : 'Create Account'}</Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">Already have an account? <Link to="/auth/login" className="text-brand-primary font-semibold hover:underline">Sign in</Link></p>
        </div>
      </div>
    </>
  )
}
