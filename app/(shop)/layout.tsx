import { ShopNavbar } from '@/components/shop/ShopNavbar';
import { BottomNav } from '@/components/shop/BottomNav';
import { CartProvider } from '@/contexts/CartContext';
import { ShopAuthProvider } from '@/contexts/ShopAuthContext';
import AIChatbot from '@/components/shop/AIChatbot';
import MarketingPopup from '@/components/shop/MarketingPopup';
import { prisma } from '@/lib/prisma';
import { Suspense } from 'react';

export default function ShopLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-100 flex justify-center">
            <div className="relative w-full max-w-md h-screen overflow-y-auto bg-stone-50 shadow-2xl">
                <ShopNavbar />
                <main className="flex flex-col gap-6 w-full pb-24">
                    {children}
                </main>
                <BottomNav />
                <AIChatbot />
                <MarketingPopup />
            </div>
        </div>
    );
}
