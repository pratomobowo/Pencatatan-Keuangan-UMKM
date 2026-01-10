'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ProductCard } from '@/components/shop/ProductCard';
import { CategoryIcon } from '@/components/shop/CategoryIcon';
import { PromoSlider } from '@/components/shop/PromoSlider';
import { Waves, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ShopProduct, Category } from '@/lib/types';

// Default image when product has no image
const DEFAULT_IMAGE = '/images/coming-soon.jpg';
const ITEMS_PER_PAGE = 8;

export default function ShopHomepage() {
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [promoProducts, setPromoProducts] = useState<ShopProduct[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastProductElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            // Fetch categories and initial products
            const catRes = await fetch('/api/shop/categories');
            if (catRes.ok) {
                const catData = await catRes.json();
                setCategories(catData);
            }

            const promoRes = await fetch('/api/shop/products?promo=true&limit=10');
            if (promoRes.ok) {
                const promoData = await promoRes.json();
                setPromoProducts(promoData.products || []);
            }
        } catch (err) {
            console.error('Error fetching initial data:', err);
        }
    };

    const fetchProducts = useCallback(async (pageNum: number) => {
        try {
            if (pageNum === 1) setLoading(true);
            else setLoadingMore(true);

            const res = await fetch(`/api/shop/products?page=${pageNum}&limit=${ITEMS_PER_PAGE}`);
            if (!res.ok) throw new Error('Failed to fetch products');

            const data = await res.json();

            setProducts(prev => pageNum === 1 ? data.products : [...prev, ...data.products]);
            setHasMore(data.hasMore);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Gagal memuat produk');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts(page);
    }, [page, fetchProducts]);

    if (loading && page === 1) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="animate-spin text-orange-500" size={40} />
                <p className="text-stone-500 text-sm font-medium">Memuat kelezatan untukmu...</p>
            </div>
        );
    }

    if (error && products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] px-4 text-center">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                    <Loader2 className="text-red-500 rotate-45" size={32} />
                </div>
                <h3 className="text-stone-900 font-bold text-lg mb-1">Yah, ada gangguan</h3>
                <p className="text-stone-500 text-sm">{error}</p>
                <button
                    onClick={() => {
                        setPage(1);
                        fetchProducts(1);
                    }}
                    className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full font-bold text-sm shadow-md"
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
            <div className="px-4 py-6">
                <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
                    {categories.map((category) => (
                        <CategoryIcon
                            key={category.id}
                            name={category.name}
                            image={category.image}
                            href={`/products?category=${category.slug}`}
                            color={category.color || 'text-orange-500'}
                        />
                    ))}
                    <CategoryIcon
                        name="Semua"
                        icon={Waves}
                        href="/products"
                        color="text-blue-500"
                    />
                </div>
            </div>

            {/* Produk Promo - Slide Style */}
            {(promoProducts.length > 0) && (
                <div className="flex flex-col gap-3 pb-8">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-stone-900 text-lg font-bold">Produk Promo</h2>
                        <Link href="/products?promo=true" className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                            Lihat Semua
                        </Link>
                    </div>
                    {/* Slide container */}
                    <div className="overflow-x-auto hide-scrollbar snap-x snap-mandatory scroll-pl-4">
                        <div className="flex gap-3 pb-2 w-max px-4">
                            {promoProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="snap-start shrink-0 w-[calc((100vw-32px-12px)/2.15)] max-w-[180px]"
                                >
                                    <ProductCard
                                        id={product.id}
                                        slug={product.slug}
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

            {/* Products Section - Pilihan Bunda */}
            <div className="flex flex-col gap-3 px-4 pb-12">
                <div className="flex items-center justify-between">
                    <h2 className="text-stone-900 text-lg font-bold">Pilihan Bunda</h2>
                </div>

                {products.length === 0 ? (
                    <div className="py-12 text-center bg-stone-50 rounded-2xl border-2 border-dashed border-stone-100">
                        <p className="text-stone-400 text-sm">Belum ada produk untuk ditampilkan</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {products.map((product, index) => {
                            const isLast = products.length === index + 1;
                            return (
                                <div ref={isLast ? lastProductElementRef : null} key={product.id}>
                                    <ProductCard
                                        id={product.id}
                                        slug={product.slug}
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
                            );
                        })}
                    </div>
                )}

                {/* Loading state for next page */}
                {loadingMore && (
                    <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-orange-500" size={24} />
                    </div>
                )}

                {!hasMore && products.length > 0 && (
                    <div className="py-8 text-center">
                        <p className="text-stone-400 text-xs font-medium italic">✨ Sudah semua telihat Bunda ✨</p>
                    </div>
                )}
            </div>
        </>
    );
}
