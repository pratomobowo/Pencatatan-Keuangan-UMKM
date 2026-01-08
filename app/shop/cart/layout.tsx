import { ShopNavbar } from '@/components/shop/ShopNavbar';
import { BottomNav } from '@/components/shop/BottomNav';

export default function CartLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-100 flex justify-center">
            <div className="relative w-full max-w-md h-screen overflow-y-auto bg-stone-50 shadow-2xl">
                {/* No ShopNavbar - cart has its own header */}
                <main className="flex flex-col w-full">
                    {children}
                </main>
                <BottomNav />
            </div>
        </div>
    );
}
