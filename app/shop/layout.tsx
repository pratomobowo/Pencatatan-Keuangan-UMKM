import { ShopNavbar } from '@/components/shop/ShopNavbar';
import { BottomNav } from '@/components/shop/BottomNav';

export default function ShopLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden pb-24 bg-stone-50 max-w-md mx-auto shadow-2xl">
            <ShopNavbar />
            <main className="flex flex-col gap-6 w-full">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
