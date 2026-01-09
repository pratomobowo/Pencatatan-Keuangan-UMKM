'use client';

import Link from 'next/link';
import { Home, Grid, ShoppingCart, Receipt, User } from 'lucide-react';
import { usePathname } from 'next/navigation';

export const BottomNav = () => {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
            <div className="flex items-center justify-around h-16 relative max-w-md mx-auto">
                <Link
                    href="/"
                    className={`flex flex-col items-center justify-center gap-1 w-16 transition-colors ${isActive('/') ? 'text-orange-500' : 'text-stone-400 hover:text-orange-500'
                        }`}
                >
                    <Home size={24} fill={isActive('/') ? 'currentColor' : 'none'} />
                    <span className="text-[10px] font-bold">Beranda</span>
                </Link>

                <Link
                    href="/products"
                    className={`flex flex-col items-center justify-center gap-1 w-16 transition-colors ${isActive('/products') ? 'text-orange-500' : 'text-stone-400 hover:text-orange-500'
                        }`}
                >
                    <Grid size={24} />
                    <span className="text-[10px] font-medium">Kategori</span>
                </Link>

                {/* Cart Button - Elevated */}
                <div className="relative -top-6">
                    <Link
                        href="/cart"
                        className="flex items-center justify-center size-14 rounded-full bg-orange-500 text-white shadow-lg shadow-orange-200 hover:scale-105 transition-transform border-4 border-white"
                    >
                        <ShoppingCart size={28} />
                        <span className="absolute top-2 right-2 size-2.5 bg-red-600 rounded-full border border-orange-500"></span>
                    </Link>
                </div>

                <Link
                    href="/orders"
                    className={`flex flex-col items-center justify-center gap-1 w-16 transition-colors ${isActive('/orders') ? 'text-orange-500' : 'text-stone-400 hover:text-orange-500'
                        }`}
                >
                    <Receipt size={24} />
                    <span className="text-[10px] font-medium">Pesanan</span>
                </Link>

                <Link
                    href="/account"
                    className={`flex flex-col items-center justify-center gap-1 w-16 transition-colors ${isActive('/account') ? 'text-orange-500' : 'text-stone-400 hover:text-orange-500'
                        }`}
                >
                    <User size={24} />
                    <span className="text-[10px] font-medium">Akun</span>
                </Link>
            </div>
        </nav>
    );
};
