import { useState, useEffect } from 'react'

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user already dismissed
    if (localStorage.getItem('pwa-dismissed') === 'true') return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler as EventListener)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as EventListener)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-dismissed', 'true')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-[68px] sm:bottom-4 left-4 right-4 z-40 animate-in slide-in-from-bottom-4 duration-300">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 flex items-center gap-4">
        <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center text-2xl shrink-0">
          🎓
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm">Install CampusHat</p>
          <p className="text-xs text-gray-500 mt-0.5">Get faster access and work offline.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDismiss}
            className="text-xs text-gray-400 hover:text-gray-600 font-medium px-2 py-1.5 rounded-lg transition-colors"
          >
            Later
          </button>
          <button
            onClick={handleInstall}
            className="bg-brand-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-brand-primary/90 transition-colors shadow-sm"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  )
}
