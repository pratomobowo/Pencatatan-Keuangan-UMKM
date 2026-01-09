'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/shop/ProductCard';
import { CategoryIcon } from '@/components/shop/CategoryIcon';
import { PromoSlider } from '@/components/shop/PromoSlider';
import { Fish, Beef, Egg, Leaf, Waves, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    stock: number;
    unit: string;
    image?: string;
    category?: string;
}

const categories = [
    { name: 'Ikan Laut', icon: Fish, href: '/products?category=ikan-laut', color: 'text-blue-400' },
    { name: 'Seafood', icon: Waves, href: '/products?category=seafood', color: 'text-orange-500' },
    { name: 'Ayam & Telur', icon: Egg, href: '/products?category=ayam', color: 'text-yellow-500' },
    { name: 'Daging Sapi', icon: Beef, href: '/products?category=daging-sapi', color: 'text-red-400' },
    { name: 'Bumbu', icon: Leaf, href: '/products?category=bumbu', color: 'text-teal-400' },
];

// Default image when product has no image
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';

export default function ShopHomepage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/products');
            if (!response.ok) throw new Error('Failed to fetch products');
            const data = await response.json();
            setProducts(data);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Gagal memuat produk');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-orange-500" size={40} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={fetchProducts}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg"
                >
                    Coba Lagi
                </button>
            </div>
        );
    }

    return (
        <>
            {/* Promo Slider */}
            <PromoSlider />

            {/* Categories */}
            <div className="px-4">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {categories.map((category) => (
                        <CategoryIcon
                            key={category.name}
                            name={category.name}
                            icon={category.icon}
                            href={category.href}
                            color={category.color}
                        />
                    ))}
                </div>
            </div>

            {/* Products Section */}
            {products.length === 0 ? (
                <div className="px-4 py-8 text-center">
                    <p className="text-gray-500">Belum ada produk tersedia</p>
                    <p className="text-sm text-gray-400 mt-2">Silakan tambahkan produk melalui admin dashboard</p>
                </div>
            ) : (
                <>
                    {/* All Products */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between px-4">
                            <h2 className="text-stone-900 text-lg font-bold">Produk Segar 🥬</h2>
                            <Link href="/products" className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                                Lihat Semua
                            </Link>
                        </div>
                        <div className="flex overflow-x-auto hide-scrollbar px-4 pb-2 gap-4">
                            {products.slice(0, 6).map((product) => (
                                <ProductCard
                                    key={product.id}
                                    id={product.id}
                                    name={product.name}
                                    unit={product.unit}
                                    price={product.price}
                                    image={product.image || DEFAULT_IMAGE}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Featured Grid */}
                    {products.length > 3 && (
                        <div className="flex flex-col gap-3 px-4 pb-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-stone-900 text-lg font-bold">Pilihan Bunda ❤️</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {products.slice(0, 4).map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        id={product.id}
                                        name={product.name}
                                        unit={product.unit}
                                        price={product.price}
                                        image={product.image || DEFAULT_IMAGE}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
}
