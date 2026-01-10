'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    User,
    Package,
    MapPin,
    Heart,
    Settings,
    HelpCircle,
    LogOut,
    ChevronRight,
    ShoppingBag,
    Bell,
    CreditCard,
    Gift,
    Star,
    Loader2
} from 'lucide-react';
import { useShopAuth } from '@/contexts/ShopAuthContext';

const menuItems = [
    {
        section: 'Program Loyalitas',
        items: [
            { icon: Gift, label: 'Loyalty & Hadiah', href: '/loyalty' },
        ]
    },
    {
        section: 'Pesanan',
        items: [
            { icon: Package, label: 'Pesanan Saya', href: '/orders' },
            { icon: ShoppingBag, label: 'Beli Lagi', href: '/products' },
        ]
    },
    {
        section: 'Akun',
        items: [
            { icon: MapPin, label: 'Alamat Pengiriman', href: '/addresses' },
            { icon: CreditCard, label: 'Metode Pembayaran', href: '/payments' },
            { icon: Heart, label: 'Favorit', href: '/favorites' },
            { icon: Bell, label: 'Notifikasi', href: '/notifications' },
        ]
    },
    {
        section: 'Lainnya',
        items: [
            { icon: Settings, label: 'Pengaturan', href: '/settings' },
            { icon: HelpCircle, label: 'Bantuan', href: '/help' },
        ]
    },
];

export default function AccountPage() {
    const router = useRouter();
    const { customer, isAuthenticated, isLoading, logout } = useShopAuth();

    const handleLogout = async () => {
        await logout();
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-orange-500" size={40} />
            </div>
        );
    }

    // Not logged in - show guest view
    if (!isAuthenticated) {
        return (
            <>
                {/* Profile Header - Guest */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-5 pt-8 pb-12">
                    <div className="flex items-center gap-4">
                        <div className="size-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border-2 border-white/50">
                            <User size={40} className="text-white" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-white text-xl font-bold">Selamat Datang!</h1>
                            <p className="text-white/80 text-sm mt-1">Login untuk pengalaman belanja lebih baik</p>
                        </div>
                    </div>

                    {/* Login/Register Buttons */}
                    <div className="flex gap-3 mt-6">
                        <Link
                            href="/login"
                            className="flex-1 bg-white text-orange-600 font-bold py-3 rounded-xl text-center shadow-lg hover:bg-orange-50 transition-colors"
                        >
                            Masuk
                        </Link>
                        <Link
                            href="/register"
                            className="flex-1 bg-white/20 backdrop-blur text-white font-bold py-3 rounded-xl text-center border border-white/30 hover:bg-white/30 transition-colors"
                        >
                            Daftar
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="px-4 -mt-6">
                    <div className="bg-white rounded-2xl shadow-lg p-4 flex justify-around border border-orange-100">
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-stone-900">0</span>
                            <span className="text-xs text-gray-500 mt-1">Pesanan</span>
                        </div>
                        <div className="w-px bg-gray-200"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-stone-900">0</span>
                            <span className="text-xs text-gray-500 mt-1">Favorit</span>
                        </div>
                        <div className="w-px bg-gray-200"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-stone-900">0</span>
                            <span className="text-xs text-gray-500 mt-1">Poin</span>
                        </div>
                    </div>
                </div>

                {/* Menu Sections */}
                <div className="px-4 py-6 flex flex-col gap-6 pb-24">
                    {menuItems.map((section) => (
                        <div key={section.section}>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">
                                {section.section}
                            </h3>
                            <div className="bg-white rounded-2xl shadow-sm border border-orange-50 overflow-hidden">
                                {section.items.map((item, index) => (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className={`flex items-center gap-4 px-4 py-4 hover:bg-orange-50 transition-colors ${index !== section.items.length - 1 ? 'border-b border-gray-100' : ''
                                            }`}
                                    >
                                        <div className="size-10 rounded-full bg-orange-100 flex items-center justify-center">
                                            <item.icon size={20} className="text-orange-600" />
                                        </div>
                                        <span className="flex-1 text-stone-900 font-medium">{item.label}</span>
                                        <ChevronRight size={20} className="text-gray-400" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* App Version */}
                    <p className="text-center text-xs text-gray-400 mt-4">
                        Pasarantar v1.0.0
                    </p>
                </div>
            </>
        );
    }

    // Logged in - show user profile
    return (
        <>
            {/* Profile Header - Logged In */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-5 pt-8 pb-12">
                <div className="flex items-center gap-4">
                    <div className="size-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border-2 border-white/50">
                        <span className="text-white text-2xl font-bold">
                            {customer?.name?.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1">
                        <h1 className="text-white text-xl font-bold">{customer?.name}</h1>
                        <p className="text-white/80 text-sm mt-1">{customer?.phone}</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="px-4 -mt-6">
                <div className="bg-white rounded-2xl shadow-lg p-4 flex justify-around border border-orange-100">
                    <Link href="/orders" className="flex flex-col items-center">
                        <span className="text-2xl font-bold text-stone-900">-</span>
                        <span className="text-xs text-gray-500 mt-1">Pesanan</span>
                    </Link>
                    <div className="w-px bg-gray-200"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-bold text-stone-900">0</span>
                        <span className="text-xs text-gray-500 mt-1">Favorit</span>
                    </div>
                    <div className="w-px bg-gray-200"></div>
                    <Link href="/loyalty" className="flex flex-col items-center">
                        <span className="text-2xl font-bold text-orange-600">{customer?.points || 0}</span>
                        <span className="text-xs text-gray-500 mt-1">Poin</span>
                    </Link>
                </div>
            </div>

            {/* Menu Sections */}
            <div className="px-4 py-6 flex flex-col gap-6 pb-24">
                {menuItems.map((section) => (
                    <div key={section.section}>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">
                            {section.section}
                        </h3>
                        <div className="bg-white rounded-2xl shadow-sm border border-orange-50 overflow-hidden">
                            {section.items.map((item, index) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex items-center gap-4 px-4 py-4 hover:bg-orange-50 transition-colors ${index !== section.items.length - 1 ? 'border-b border-gray-100' : ''
                                        }`}
                                >
                                    <div className="size-10 rounded-full bg-orange-100 flex items-center justify-center">
                                        <item.icon size={20} className="text-orange-600" />
                                    </div>
                                    <span className="flex-1 text-stone-900 font-medium">{item.label}</span>
                                    <ChevronRight size={20} className="text-gray-400" />
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-4 px-4 py-4 bg-white rounded-2xl shadow-sm border border-red-100 hover:bg-red-50 transition-colors"
                >
                    <div className="size-10 rounded-full bg-red-100 flex items-center justify-center">
                        <LogOut size={20} className="text-red-600" />
                    </div>
                    <span className="flex-1 text-red-600 font-medium text-left">Keluar</span>
                </button>

                {/* App Version */}
                <p className="text-center text-xs text-gray-400 mt-4">
                    Pasarantar v1.0.0
                </p>
            </div>
        </>
    );
}
