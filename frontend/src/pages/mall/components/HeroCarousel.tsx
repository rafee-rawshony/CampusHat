import { useState, useEffect } from 'react'
import { LazyImage } from '@/components/ui/LazyImage'
import { Link } from 'react-router-dom'

export function HeroCarousel({ banners }: { banners: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!banners || banners.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [banners])

  if (!banners || banners.length === 0) {
    return (
      <div className="w-full h-[200px] md:h-[400px] bg-gray-100 flex items-center justify-center text-gray-400 font-medium">
        Loading Carousel...
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-hidden h-[200px] sm:h-[300px] md:h-[400px] lg:h-[450px]">
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner, index) => (
          <div key={banner.id || index} className="w-full h-full flex-shrink-0 relative">
            <Link to={banner.link || '#'}>
              <LazyImage
                src={banner.image_url}
                alt={banner.title || 'Banner'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20" />
              {banner.title && (
                <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 text-white text-left max-w-2xl">
                  <h2 className="text-2xl md:text-5xl font-bold mb-4 drop-shadow-md">{banner.title}</h2>
                </div>
              )}
            </Link>
          </div>
        ))}
      </div>
      
      {/* Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${
                index === currentIndex ? 'bg-white w-6 md:w-8' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
