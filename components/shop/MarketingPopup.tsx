'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface PopupConfig {
    popupEnabled: boolean;
    popupImage: string | null;
    popupTitle: string | null;
    popupLink: string | null;
    popupShowOnce: boolean;
    popupDelay: number;
}

export default function MarketingPopup() {
    const [config, setConfig] = useState<PopupConfig | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/shop/config');
                if (res.ok) {
                    const data = await res.json();
                    setConfig(data);

                    if (data.popupEnabled && data.popupImage) {
                        const hasSeenPopup = sessionStorage.getItem('hasSeenMarketingPopup');

                        if (!data.popupShowOnce || !hasSeenPopup) {
                            setTimeout(() => {
                                setIsVisible(true);
                                setIsAnimating(true);
                                if (data.popupShowOnce) {
                                    sessionStorage.setItem('hasSeenMarketingPopup', 'true');
                                }
                            }, data.popupDelay || 2000);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching popup config:', error);
            }
        };

        fetchConfig();
    }, []);

    const closePopup = () => {
        setIsAnimating(false);
        setTimeout(() => setIsVisible(false), 300);
    };

    if (!isVisible || !config || !config.popupImage) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
            <div
                className={`relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl transition-transform duration-300 ${isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={closePopup}
                    className="absolute top-4 right-4 z-10 size-10 flex items-center justify-center bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Content */}
                <div className="relative aspect-[3/4] w-full">
                    {config.popupLink ? (
                        <a href={config.popupLink} target={config.popupLink.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer">
                            <Image
                                src={config.popupImage}
                                alt={config.popupTitle || 'Promo'}
                                fill
                                className="object-cover cursor-pointer hover:scale-105 transition-transform duration-700"
                            />
                        </a>
                    ) : (
                        <Image
                            src={config.popupImage}
                            alt={config.popupTitle || 'Promo'}
                            fill
                            className="object-cover"
                        />
                    )}
                </div>

                {config.popupTitle && (
                    <div className="p-6 text-center">
                        <h3 className="text-xl font-bold text-stone-900">{config.popupTitle}</h3>
                        {config.popupLink && (
                            <a
                                href={config.popupLink}
                                className="inline-block mt-4 px-8 py-3 bg-orange-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-200 hover:bg-orange-600 active:scale-95 transition-all"
                            >
                                Lihat Detail
                            </a>
                        )}
                    </div>
                )}
            </div>

            {/* Backdrop click to close */}
            <div className="absolute inset-0 -z-10" onClick={closePopup} />
        </div>
    );
}
