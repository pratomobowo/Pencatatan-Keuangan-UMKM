'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PromoBanner } from '@/lib/types';
import { bannersAPI } from '@/lib/api';

interface PromoSliderProps {
    initialBanners?: PromoBanner[];
}

export const PromoSlider = ({ initialBanners }: PromoSliderProps) => {
    const [banners, setBanners] = useState<PromoBanner[]>(initialBanners || []);
    const [loading, setLoading] = useState(!initialBanners || initialBanners.length === 0);

    useEffect(() => {
        // Only fetch if no initial banners provided (fallback)
        if (!initialBanners || initialBanners.length === 0) {
            fetchBanners();
        }
    }, [initialBanners]);

    const fetchBanners = async () => {
        try {
            const data = await bannersAPI.getPublic();
            setBanners(data);
        } catch (error) {
            console.error('Failed to fetch banners:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full px-4 mt-4">
                <div className="w-full aspect-[2/1] rounded-xl bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">
                    Memuat promo...
                </div>
            </div>
        );
    }

    if (banners.length === 0) return null;

    return (
        <div className="w-full px-4 mt-4">
            <div className="flex overflow-x-auto hide-scrollbar gap-4 snap-x snap-mandatory rounded-xl">
                {banners.map((slide, index) => (
                    <div
                        key={slide.id}
                        className="snap-center shrink-0 w-full relative aspect-[2/1] rounded-xl overflow-hidden bg-gray-200"
                    >
                        <Image
                            src={slide.image}
                            alt={slide.title}
                            fill
                            className="object-cover"
                            priority={index === 0} // Priority load for first banner (LCP)
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex flex-col justify-center p-6">
                            {slide.badge && (
                                <span className="bg-orange-500 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded w-fit mb-2 shadow-sm uppercase">
                                    {slide.badge}
                                </span>
                            )}
                            <h2 className="text-white text-xl md:text-2xl font-bold leading-tight mb-1">{slide.title}</h2>
                            {slide.subtitle && (
                                <p className="text-white/90 text-xs md:text-sm mb-4 line-clamp-1">{slide.subtitle}</p>
                            )}
                            <Link
                                href={slide.link || '/products'}
                                className="bg-white text-stone-900 px-4 py-2 rounded-lg text-xs md:text-sm font-bold w-fit hover:bg-orange-500 hover:text-white transition-colors"
                            >
                                {slide.buttonText || 'Belanja Sekarang'}
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
