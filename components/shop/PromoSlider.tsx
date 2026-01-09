'use client';

import { useState } from 'react';
import Image from 'next/image';

interface PromoSlide {
    title: string;
    subtitle: string;
    badge: string;
    image: string;
    buttonText: string;
}

const promoSlides: PromoSlide[] = [
    {
        title: 'Ikan Laut Segar',
        subtitle: 'Langsung dari nelayan lokal',
        badge: 'PROMO SPESIAL',
        image: '/images/coming-soon.jpg',
        buttonText: 'Belanja Sekarang',
    },
    {
        title: 'Daging Sapi Pilihan',
        subtitle: 'Potongan premium untuk keluarga',
        badge: 'FLASH SALE',
        image: '/images/coming-soon.jpg',
        buttonText: 'Lihat Promo',
    },
];

export const PromoSlider = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    return (
        <div className="w-full px-4 mt-4">
            <div className="flex overflow-x-auto hide-scrollbar gap-4 snap-x snap-mandatory rounded-xl">
                {promoSlides.map((slide, index) => (
                    <div
                        key={index}
                        className="snap-center shrink-0 w-full relative aspect-[2/1] rounded-xl overflow-hidden bg-gray-200"
                    >
                        <Image
                            src={slide.image}
                            alt={slide.title}
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex flex-col justify-center p-6">
                            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded w-fit mb-2 shadow-sm">
                                {slide.badge}
                            </span>
                            <h2 className="text-white text-2xl font-bold leading-tight mb-1">{slide.title}</h2>
                            <p className="text-white/90 text-sm mb-4">{slide.subtitle}</p>
                            <button className="bg-white text-stone-900 px-4 py-2 rounded-lg text-sm font-bold w-fit hover:bg-orange-500 hover:text-white transition-colors">
                                {slide.buttonText}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
