import { useState, useEffect } from 'react'
import { X, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FilterBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  onApply?: () => void
  onReset?: () => void
}

export function FilterBottomSheet({ 
  isOpen, 
  onClose, 
  children, 
  title = 'Filters',
  onApply,
  onReset
}: FilterBottomSheetProps) {
  const [isRendered, setIsRendered] = useState(false)

  // Handle animation timing
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true)
      document.body.style.overflow = 'hidden' // Prevent bg scroll
    } else {
      const timer = setTimeout(() => setIsRendered(false), 300) // matches duration
      document.body.style.overflow = ''
      return () => clearTimeout(timer)
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isRendered) return null

  return (
    <div className="fixed inset-0 z-[60] sm:hidden">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 flex flex-col max-h-[90dvh] ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag Handle & Header */}
        <div className="pt-3 pb-2 px-4 border-b flex items-center justify-between shrink-0">
           <div className="w-12 h-1 bg-gray-200 rounded-full absolute top-2 left-1/2 -translate-x-1/2" />
           <h3 className="font-bold text-gray-900 flex items-center gap-2 mt-2">
             <Filter size={18} className="text-brand-primary" /> {title}
           </h3>
           <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-900 rounded-full mt-1">
             <X size={20} />
           </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
          {children}
        </div>

        {/* Footer Actions */}
        {(onApply || onReset) && (
          <div className="p-4 border-t flex items-center justify-between gap-3 shrink-0 bg-white pb-[calc(1rem+env(safe-area-inset-bottom))]">
             {onReset && (
               <Button variant="outline" className="flex-1 font-bold h-12" onClick={onReset}>
                 Reset
               </Button>
             )}
             {onApply && (
               <Button className="flex-[2] font-bold h-12 shadow-sm" onClick={() => { onApply(); onClose() }}>
                 Show Results
               </Button>
             )}
          </div>
        )}
      </div>
    </div>
  )
}
