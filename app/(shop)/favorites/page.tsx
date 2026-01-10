'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Heart, ShoppingBag, Loader2 } from 'lucide-react';
import { ProductCard } from '@/components/shop/ProductCard';
import { useShopAuth } from '@/contexts/ShopAuthContext';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    unit: string;
    category: string;
    variants: any[];
}

export default function FavoritesPage() {
    const { isAuthenticated, isLoading: authLoading } = useShopAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated) {
            fetchFavorites();
        } else if (!authLoading) {
            setIsLoading(false);
        }
    }, [isAuthenticated, authLoading]);

    const fetchFavorites = async () => {
        try {
            const response = await fetch('/api/shop/favorites');
            if (response.ok) {
                const data = await response.json();
                setProducts(data);
            }
        } catch (error) {
            console.error('Failed to fetch favorites:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <header className="bg-white border-b sticky top-0 z-20 px-4 py-3 flex items-center gap-4">
                    <Link href="/account" className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                        <ChevronLeft size={24} className="text-gray-700" />
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900">Favorit Saya</h1>
                </header>
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin text-orange-500" size={40} />
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <header className="bg-white border-b sticky top-0 z-20 px-4 py-3 flex items-center gap-4">
                    <Link href="/account" className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                        <ChevronLeft size={24} className="text-gray-700" />
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900">Favorit Saya</h1>
                </header>
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="size-20 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                        <Heart size={40} className="text-orange-500" />
                    </div>
                    <h2 className="text-xl font-bold text-stone-900 mb-2">Belum Login</h2>
                    <p className="text-gray-500 mb-6">Silakan login untuk melihat daftar produk favorit Anda.</p>
                    <Link
                        href="/login"
                        className="bg-orange-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all"
                    >
                        Masuk Sekarang
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
            <header className="bg-white border-b sticky top-0 z-20 px-4 py-3 flex items-center gap-4">
                <Link href="/account" className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                    <ChevronLeft size={24} className="text-gray-700" />
                </Link>
                <h1 className="text-lg font-bold text-gray-900">Favorit Saya</h1>
            </header>

            <main className="flex-1 px-4 pt-2 pb-24">
                {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="size-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Heart size={40} className="text-gray-300" />
                        </div>
                        <h2 className="text-xl font-bold text-stone-900 mb-2">Belum Ada Favorit</h2>
                        <p className="text-gray-500 mb-6">Produk yang Anda sukai akan muncul di sini.</p>
                        <Link
                            href="/products"
                            className="text-orange-500 font-bold hover:underline inline-flex items-center gap-2"
                        >
                            <ShoppingBag size={20} />
                            Mulai Belanja
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                name={product.name}
                                image={product.image}
                                description={product.description}
                                price={Number(product.price)}
                                unit={product.unit}
                                layout="horizontal"
                                variants={product.variants}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
