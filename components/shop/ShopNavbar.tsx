'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Bell, X, Loader2, Trash2 } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { usePathname } from 'next/navigation';

export const ShopNavbar = () => {
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    const { notifications, unreadCount, markAsRead, clearNotifications } = useNotifications();

    // Handle click outside to close results
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggleNotifications = () => {
        if (!showNotifications) {
            markAsRead(); // Mark as read when opening
        }
        setShowNotifications(!showNotifications);
    };

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

    // List of pages with specialized headers that should hide the main navbar
    const hasSpecialHeader = [
        '/cart', '/checkout', '/orders', '/account', '/login', '/register',
        '/addresses', '/favorites', '/notifications', '/settings', '/help', '/payments',
        '/products' // List page has its own search/header
    ];

    const isProductDetail = pathname.startsWith('/products/') && pathname !== '/products';

    if (hasSpecialHeader.includes(pathname) && !isProductDetail) return null;

    return (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm w-full">
            {/* Logo & Notification */}
            <div className="flex items-center justify-between p-4 pb-2">
                <Link href="/" className="flex items-center group">
                    <div className="relative w-80 h-28 shrink-0 transform group-hover:scale-105 transition-transform duration-300">
                        <Image
                            src="/logo.webp"
                            alt="Pasarantar Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </Link>
                <div className="relative" ref={notificationsRef}>
                    <button
                        onClick={handleToggleNotifications}
                        className="flex size-10 items-center justify-center rounded-full bg-stone-50 hover:bg-orange-50 transition-colors relative"
                    >
                        <Bell className="text-stone-900" size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 flex min-size-4 items-center justify-center bg-red-500 rounded-full border border-white text-[10px] text-white font-bold px-1">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden z-50 animate-fade-in">
                            <div className="p-4 border-b border-stone-50 flex items-center justify-between">
                                <h3 className="text-stone-900 font-semibold">Notifikasi</h3>
                                {notifications.length > 0 && (
                                    <button
                                        onClick={clearNotifications}
                                        className="text-stone-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <p className="text-stone-400 text-sm">Belum ada notifikasi</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        {notifications.map((n) => (
                                            <div
                                                key={n.id}
                                                className={`p-4 border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors ${!n.read ? 'bg-orange-50/30' : ''}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-1 size-2 shrink-0 rounded-full ${n.type === 'success' ? 'bg-orange-500' :
                                                        n.type === 'error' ? 'bg-red-500' :
                                                            'bg-blue-500'
                                                        }`} />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-stone-900">{n.title}</p>
                                                        <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{n.message}</p>
                                                        <p className="text-[10px] text-stone-400 mt-2">
                                                            {new Date(n.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
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
                                                src={product.image || '/images/coming-soon.jpg'}
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
