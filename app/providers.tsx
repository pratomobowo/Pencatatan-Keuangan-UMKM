'use client';

import { SessionProvider } from 'next-auth/react';
import { ShopAuthProvider } from '@/contexts/ShopAuthContext';
import { CartProvider } from '@/contexts/CartContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ShopAuthProvider>
                <CartProvider>
                    {children}
                </CartProvider>
            </ShopAuthProvider>
        </SessionProvider>
    );
}
