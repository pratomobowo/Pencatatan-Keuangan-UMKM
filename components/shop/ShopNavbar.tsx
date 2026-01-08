'use client';

import Link from 'next/link';
import { Search, Bell, MapPin, ChevronDown } from 'lucide-react';

export const ShopNavbar = () => {
    return (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm w-full">
            {/* Location & Notification */}
            <div className="flex items-center justify-between p-4 pb-2">
                <div className="flex flex-1 flex-col justify-center">
                    <span className="text-xs font-medium text-stone-500">Dikirim ke:</span>
                    <div className="flex items-center gap-1 cursor-pointer group">
                        <MapPin className="text-orange-500 group-hover:text-teal-500 transition-colors" size={20} />
                        <h2 className="text-stone-900 text-sm font-bold leading-tight truncate max-w-[240px]">
                            Rumah (Jakarta Selatan)
                        </h2>
                        <ChevronDown className="text-stone-900" size={18} />
                    </div>
                </div>
                <button className="flex size-10 items-center justify-center rounded-full bg-stone-50 hover:bg-orange-50 transition-colors relative">
                    <Bell className="text-stone-900" size={20} />
                    <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border border-white"></span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="px-4 pb-4">
                <div className="flex w-full items-center rounded-xl bg-stone-50 border border-transparent focus-within:border-orange-500 transition-all h-12 overflow-hidden ring-1 ring-transparent focus-within:ring-orange-500/20">
                    <div className="flex items-center justify-center pl-4 pr-2">
                        <Search className="text-stone-400" size={20} />
                    </div>
                    <input
                        className="flex w-full min-w-0 flex-1 bg-transparent text-stone-900 placeholder:text-stone-400 focus:outline-0 border-none h-full text-base font-normal px-2"
                        placeholder="Cari ikan, daging, bumbu..."
                    />
                </div>
            </div>
        </header>
    );
};
