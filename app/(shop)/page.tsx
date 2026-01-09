'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/shop/ProductCard';
import { CategoryIcon } from '@/components/shop/CategoryIcon';
import { PromoSlider } from '@/components/shop/PromoSlider';
import { Fish, Beef, Egg, Leaf, Waves, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Product, ShopProduct } from '@/lib/types';

// Extended Product type for frontend display needs (if strictly necessary, otherwise use shared type)
// The shared type already has everything we need plus variants

const categories = [
    { name: 'Ikan Laut', icon: Fish, href: '/products?category=ikan-laut', color: 'text-blue-400' },
    { name: 'Seafood', icon: Waves, href: '/products?category=seafood', color: 'text-orange-500' },
    { name: 'Ayam & Telur', icon: Egg, href: '/products?category=ayam', color: 'text-yellow-500' },
    { name: 'Daging Sapi', icon: Beef, href: '/products?category=daging-sapi', color: 'text-red-400' },
    { name: 'Bumbu', icon: Leaf, href: '/products?category=bumbu', color: 'text-orange-500' },
];

// Default image when product has no image
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';

export default function ShopHomepage() {
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [promoProducts, setPromoProducts] = useState<ShopProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            // Fetch all products and promo products in parallel
            const [allRes, promoRes] = await Promise.all([
                fetch('/api/shop/products'),
                fetch('/api/shop/products?promo=true'),
            ]);

            if (!allRes.ok) throw new Error('Failed to fetch products');

            const allData = await allRes.json();
            setProducts(allData);

            if (promoRes.ok) {
                const promoData = await promoRes.json();
                setPromoProducts(promoData);
            }
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

            {/* Produk Promo - Slide Style */}
            {(promoProducts.length > 0 || products.length > 0) && (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-stone-900 text-lg font-bold">🔥 Produk Promo</h2>
                        <Link href="/products?promo=true" className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                            Lihat Semua
                        </Link>
                    </div>
                    {/* Slide container - shows 2 cards + peek of 3rd */}
                    <div className="overflow-x-auto hide-scrollbar snap-x snap-mandatory scroll-pl-4">
                        <div className="flex gap-3 pb-2 w-max px-4">
                            {/* Use promo products if available, otherwise show regular products with fake promo */}
                            {(promoProducts.length > 0 ? promoProducts : products).slice(0, 8).map((product) => (
                                <div
                                    key={product.id}
                                    className="snap-start shrink-0 w-[calc((100vw-32px-12px)/2.15)] max-w-[180px]"
                                >
                                    <ProductCard
                                        id={product.id}
                                        name={product.name}
                                        unit={product.unit}
                                        price={product.displayPrice || product.price}
                                        originalPrice={product.originalPrice || undefined}
                                        discount={product.discount || undefined}
                                        image={product.image || DEFAULT_IMAGE}
                                        isGrid={true}
                                        variants={product.variants}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Products Section */}
            {products.length === 0 ? (
                <div className="px-4 py-8 text-center">
                    <p className="text-gray-500">Belum ada produk tersedia</p>
                    <p className="text-sm text-gray-400 mt-2">Silakan tambahkan produk melalui admin dashboard</p>
                </div>
            ) : (
                <>
                    {/* All Products */}

                    {/* Featured Grid */}
                    {products.length > 3 && (
                        <div className="flex flex-col gap-3 px-4 pb-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-stone-900 text-lg font-bold">Pilihan Bunda ❤️</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {products.slice(0, 4).map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        id={product.id}
                                        name={product.name}
                                        unit={product.unit}
                                        price={product.price}
                                        image={product.image || DEFAULT_IMAGE}
                                        isGrid={true}
                                        variants={product.variants}
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
