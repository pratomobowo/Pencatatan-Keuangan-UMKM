import { ShopNavbar } from '@/components/shop/ShopNavbar';

export default function ProductDetailLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-100 flex justify-center">
            <div className="relative w-full max-w-md h-screen overflow-y-auto bg-stone-50 shadow-2xl">
                <ShopNavbar />
                <main className="flex flex-col gap-6 w-full">
                    {children}
                </main>
                {/* No BottomNav here - product detail has its own Add to Cart bar */}
            </div>
        </div>
    );
}
