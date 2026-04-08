import { X, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface VerificationRequiredCardProps {
  onDismiss: () => void
}

export function VerificationRequiredCard({ onDismiss }: VerificationRequiredCardProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-orange-50 h-24 flex items-center justify-center border-b border-orange-100">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
            <ShieldAlert size={24} />
          </div>
        </div>
        
        {/* Close Button */}
        <button 
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1.5 bg-white/50 hover:bg-white rounded-full text-gray-500 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Student ID Required</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            To maintain a safe campus marketplace, we require all users to verify their university status before posting ads or contacting sellers.
          </p>

          <div className="flex flex-col gap-3">
            <Link to="/account/verify" onClick={onDismiss} className="w-full">
              <Button className="w-full font-bold shadow-md h-11">
                Verify Now
              </Button>
            </Link>
            <button 
              onClick={onDismiss}
              className="text-gray-500 text-sm font-medium hover:text-gray-900 transition-colors py-2"
            >
              Maybe Later
            </button>
          </div>
        </div>
        
      </div>
    </div>
  )
}
