import { ShopNavbar } from '@/components/shop/ShopNavbar';
import { BottomNav } from '@/components/shop/BottomNav';

export default function ShopLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-100 flex justify-center">
            <div className="relative flex h-auto min-h-screen w-full max-w-md flex-col overflow-x-hidden pb-24 bg-stone-50 shadow-2xl">
                <ShopNavbar />
                <main className="flex flex-col gap-6 w-full">
                    {children}
                </main>
                <BottomNav />
            </div>
        </div>
    );
}
