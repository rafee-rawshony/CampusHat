'use client'
import { useState, useEffect } from 'react'

export function PWAInstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null)
  const [show, setShow]   = useState(false)

  useEffect(() => {
    if (localStorage.getItem('pwa-dismissed')) return
    const handler = (e: any) => { 
      e.preventDefault(); 
      setPrompt(e); 
      setShow(true); 
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    }
    setShow(false)
    setPrompt(null)
  }

  const dismiss = () => {
    setShow(false)
    localStorage.setItem('pwa-dismissed', '1')
  }

  if (!show) return null

  return (
    <div className='fixed z-50 left-4 right-4
                    bottom-[80px] sm:bottom-4 sm:left-auto sm:right-4 sm:w-80
                    bg-brand-primary text-white rounded-2xl p-4
                    shadow-xl shadow-brand-primary/30
                    flex items-center gap-3 animate-slide-up'>
      <span className='text-3xl shrink-0'>📱</span>
      <div className='flex-1 min-w-0'>
        <p className='font-bold text-sm'>Install CampusHat</p>
        <p className='text-xs opacity-80 mt-0.5'>
          Add to home screen for the best experience
        </p>
      </div>
      <div className='flex flex-col gap-1 shrink-0'>
        <button 
          onClick={install}
          className='bg-white text-brand-primary text-xs
                     font-bold px-3 py-1.5 rounded-lg'
        >
          Install
        </button>
        <button 
          onClick={dismiss}
          className='text-white/60 text-xs text-center'
        >
          Not now
        </button>
      </div>
    </div>
  )
}
