import { CartProvider } from '@/contexts/CartContext';

export default function CheckoutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <CartProvider>
            <div className="min-h-screen bg-gray-100 flex justify-center">
                <div className="relative w-full max-w-md h-screen overflow-y-auto bg-stone-50 shadow-2xl">
                    {children}
                </div>
            </div>
        </CartProvider>
    );
}
