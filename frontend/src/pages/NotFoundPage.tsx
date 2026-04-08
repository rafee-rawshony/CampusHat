import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
export default function NotFoundPage() {
  return (<><Helmet><title>404 Not Found | CampusHat</title></Helmet>
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center"><FileQuestion size={48} className="mx-auto text-gray-400 mb-4" /><h1 className="text-4xl font-extrabold text-brand-primary mb-2">404</h1><p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p><Link to="/" className="bg-brand-primary text-white font-bold px-6 py-2.5 rounded-xl hover:bg-brand-dark transition-colors">Go Home</Link></div>
    </div></>)
}
