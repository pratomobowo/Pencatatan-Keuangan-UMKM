'use client';

import Link from 'next/link';
import { Home, Grid, ShoppingCart, Book, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';

export const BottomNav = () => {
    const pathname = usePathname();
    const { itemCount } = useCart();

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
                    <span className="text-[10px] font-semibold">Beranda</span>
                </Link>

                <Link
                    href="/products"
                    className={`flex flex-col items-center justify-center gap-1 w-16 transition-colors ${isActive('/products') ? 'text-orange-500' : 'text-stone-400 hover:text-orange-500'
                        }`}
                >
                    <Grid size={24} />
                    <span className="text-[10px] font-medium">Kategori</span>
                </Link>

                <Link
                    href="/cart"
                    className="flex flex-col items-center justify-center w-16 relative"
                >
                    <div className="size-12 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-200 relative">
                        <ShoppingCart size={24} />
                        {itemCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-4.5 bg-red-600 rounded-full border border-white flex items-center justify-center px-1 text-[9px] font-bold text-white shadow-sm">
                                {itemCount}
                            </span>
                        )}
                    </div>
                </Link>

                <Link
                    href="/recipes"
                    className={`flex flex-col items-center justify-center gap-1 w-16 transition-colors ${isActive('/recipes') ? 'text-orange-500' : 'text-stone-400 hover:text-orange-500'
                        }`}
                >
                    <Book size={24} />
                    <span className="text-[10px] font-medium">Resep</span>
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
