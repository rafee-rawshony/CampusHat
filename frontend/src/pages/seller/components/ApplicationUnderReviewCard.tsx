import { Link } from 'react-router-dom'
import { Clock, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ApplicationUnderReviewCard() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-lg border p-8 text-center animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-blue-500 animate-pulse" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Application Under Review</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Your seller account application has been received and is currently being reviewed by our moderation team. This usually takes 1-2 business days.
        </p>

        <div className="flex flex-col gap-3">
          <Link to="/">
            <Button className="w-full font-bold h-12 shadow-sm gap-2">
              <ArrowLeft size={18} /> Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
