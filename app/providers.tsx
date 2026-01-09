'use client';

import { SessionProvider } from 'next-auth/react';
import { ShopAuthProvider } from '@/contexts/ShopAuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ShopAuthProvider>
                <NotificationProvider>
                    <CartProvider>
                        {children}
                    </CartProvider>
                </NotificationProvider>
            </ShopAuthProvider>
        </SessionProvider>
    );
}
