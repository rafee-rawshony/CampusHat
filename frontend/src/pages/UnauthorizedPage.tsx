import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
export default function UnauthorizedPage() {
  return (<><Helmet><title>Unauthorized | CampusHat</title></Helmet>
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center"><ShieldX size={48} className="mx-auto text-red-400 mb-4" /><h1 className="text-2xl font-bold mb-2">Access Denied</h1><p className="text-gray-500 mb-6">You don't have permission to view this page.</p><Link to="/" className="text-brand-primary font-semibold hover:underline">Go Home</Link></div>
    </div></>)
}
