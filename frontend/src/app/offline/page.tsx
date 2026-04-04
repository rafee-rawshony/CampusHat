'use client'

export default function OfflinePage() {
  return (
    <div className='flex flex-col items-center justify-center
                    min-h-screen px-6 text-center bg-white'>
      <div className='text-6xl mb-6'>📡</div>
      <h1 className='text-2xl font-bold text-brand-primary mb-2'>
        You are offline
      </h1>
      <p className='text-gray-500 text-sm max-w-xs mb-8'>
        Check your internet connection and try again.
        Some pages may still be available from cache.
      </p>
      <button
        onClick={() => window.location.reload()}
        className='bg-brand-primary text-white px-8 py-3
                   rounded-xl font-semibold text-sm'>
        Try Again
      </button>
    </div>
  )
}
