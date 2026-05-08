import React, { useState } from 'react'
import Image from 'next/image'

interface ListingImageGalleryProps {
    images: { id: number | string; image?: string; image_url?: string }[]
    postType: string
    title: string
}

function getImageUrl(image?: { image?: string; image_url?: string }) {
    return image?.image_url || image?.image || ''
}

export function ListingImageGallery({ images, postType, title }: ListingImageGalleryProps) {
    const [activeImage, setActiveImage] = useState(0)
    const activeUrl = getImageUrl(images[activeImage])

    return (
        <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
            <div className="relative aspect-[4/3] w-full bg-gray-50 rounded-xl overflow-hidden mb-2">
                {activeUrl ? (
                    <Image
                        src={activeUrl}
                        alt={title}
                        fill
                        unoptimized
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
                            <Image src={getImageUrl(img)} alt="Thumbnail" fill unoptimized className="object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
