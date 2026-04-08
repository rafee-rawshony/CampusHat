import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
export default function VerifyEmailPage() {
  return (<><Helmet><title>Verify Email | CampusHat</title></Helmet><div className="min-h-[70vh] flex items-center justify-center px-4"><div className="text-center max-w-md"><div className="w-16 h-16 bg-brand-light rounded-full mx-auto flex items-center justify-center mb-6"><Mail size={28} className="text-brand-primary" /></div><h1 className="text-2xl font-bold mb-2">Check your email</h1><p className="text-gray-500 mb-6">We've sent a verification link to your email address.</p><Link to="/auth/login" className="text-brand-primary font-semibold hover:underline">Back to login</Link></div></div></>)
}
