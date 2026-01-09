'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Bell, X, Loader2 } from 'lucide-react';

export const ShopNavbar = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close results
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                setIsSearching(true);
                setShowResults(true);
                try {
                    const res = await fetch(`/api/shop/products?search=${encodeURIComponent(searchQuery)}&limit=5`);
                    if (res.ok) {
                        const data = await res.json();
                        setSearchResults(data);
                    }
                } catch (error) {
                    console.error('Search error:', error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    return (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm w-full">
            {/* Logo & Notification */}
            <div className="flex items-center justify-between p-4 pb-2">
                <div className="flex items-center gap-2">
                    <div className="size-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200">
                        <span className="text-white text-lg font-black">PA</span>
                    </div>
                    <span className="text-stone-900 text-xl font-semibold">Pasarantar</span>
                </div>
                <button className="flex size-10 items-center justify-center rounded-full bg-stone-50 hover:bg-orange-50 transition-colors relative">
                    <Bell className="text-stone-900" size={20} />
                    <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border border-white"></span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="px-4 pb-4 relative" ref={searchRef}>
                <div className="flex w-full items-center rounded-xl bg-stone-50 border border-transparent focus-within:border-orange-500 transition-all h-12 overflow-hidden ring-1 ring-transparent focus-within:ring-orange-500/20">
                    <div className="flex items-center justify-center pl-4 pr-2">
                        {isSearching ? (
                            <Loader2 className="text-orange-500 animate-spin" size={20} />
                        ) : (
                            <Search className="text-stone-400" size={20} />
                        )}
                    </div>
                    <input
                        className="flex w-full min-w-0 flex-1 bg-transparent text-stone-900 placeholder:text-stone-400 focus:outline-0 border-none h-full text-base font-normal px-2"
                        placeholder="Cari ikan, daging, bumbu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => searchQuery.trim().length >= 2 && setShowResults(true)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="p-3 text-stone-400 hover:text-stone-600"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Search Results Dropdown */}
                {showResults && (searchQuery.trim().length >= 2) && (
                    <div className="absolute top-full left-4 right-4 bg-white mt-1 rounded-2xl shadow-xl border border-stone-100 overflow-hidden z-50 animate-fade-in max-h-96 overflow-y-auto">
                        {!isSearching && searchResults.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-stone-400 text-sm">Tidak ada produk yang ditemukan</p>
                            </div>
                        ) : (
                            <div className="flex flex-col p-2">
                                {searchResults.map((product) => (
                                    <Link
                                        key={product.id}
                                        href={`/products/${product.id}`}
                                        onClick={() => setShowResults(false)}
                                        className="flex items-center gap-3 p-2 hover:bg-orange-50 rounded-xl transition-colors group"
                                    >
                                        <div className="size-12 rounded-lg bg-stone-100 overflow-hidden relative shrink-0">
                                            <Image
                                                src={product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80'}
                                                alt={product.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-stone-900 text-sm font-semibold truncate group-hover:text-orange-600 transition-colors">
                                                {product.name}
                                            </p>
                                            <p className="text-orange-500 text-xs font-bold">
                                                Rp {product.displayPrice.toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};
