import { Helmet } from 'react-helmet-async'

export default function OfflinePage() {
  return (
    <>
      <Helmet><title>Offline | CampusHat</title></Helmet>
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-gray-50">
        <div className="text-6xl mb-6 animate-bounce">📡</div>
        <h1 className="text-2xl font-bold text-brand-primary mb-2">You are offline</h1>
        <p className="text-gray-500 text-sm mb-8 max-w-xs">
          It looks like your internet connection dropped. Check your network and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-brand-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-brand-primary/90 transition-colors shadow-md active:scale-95"
        >
          Try Again
        </button>
      </div>
    </>
  )
}
