import React, { useState } from 'react'
import Image from 'next/image'

interface ListingImageGalleryProps {
    images: { id: number | string; image: string }[]
    postType: string
    title: string
}

export function ListingImageGallery({ images, postType, title }: ListingImageGalleryProps) {
    const [activeImage, setActiveImage] = useState(0)

    return (
        <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
            <div className="relative aspect-[4/3] w-full bg-gray-50 rounded-xl overflow-hidden mb-2">
                {images.length > 0 ? (
                    <Image
                        src={images[activeImage].image}
                        alt={title}
                        fill
                        className="object-contain"
                    />
                ) : (
                    <div className={`flex items-center justify-center w-full h-full text-white text-2xl font-bold px-8 text-center ${
                        postType === 'buy' ? 'bg-blue-500' :
                        postType === 'rental' ? 'bg-gray-500' :
                        postType === 'service' ? 'bg-purple-500' :
                        'bg-amber-500'
                    }`}>
                        {title}
                    </div>
                )}
            </div>
            {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide">
                    {images.map((img, idx) => (
                        <button
                            key={img.id || idx}
                            onClick={() => setActiveImage(idx)}
                            className={`relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-brand-primary scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
                        >
                            <Image src={img.image} alt="Thumbnail" fill className="object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
