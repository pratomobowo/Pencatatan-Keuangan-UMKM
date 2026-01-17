'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ProductCard } from '@/components/shop/ProductCard';
import { CategoryIcon } from '@/components/shop/CategoryIcon';
import { PromoSlider } from '@/components/shop/PromoSlider';
import { Waves, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ShopProduct, Category, PromoBanner } from '@/lib/types';

const DEFAULT_IMAGE = '/images/coming-soon.jpg';
const ITEMS_PER_PAGE = 8;

interface ShopHomeClientProps {
    initialProducts: ShopProduct[];
    initialPromoProducts: ShopProduct[];
    initialCategories: Category[];
    initialHasMore: boolean;
    initialBanners: PromoBanner[];
}

export default function ShopHomeClient({
    initialProducts,
    initialPromoProducts,
    initialCategories,
    initialHasMore,
    initialBanners,
}: ShopHomeClientProps) {
    const [products, setProducts] = useState<ShopProduct[]>(initialProducts);
    const promoProducts = initialPromoProducts;
    const [categories] = useState<Category[]>(initialCategories);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(initialHasMore);

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

    const fetchingRef = useRef(false);
    const hasMoreRef = useRef(true);

    useEffect(() => {
        hasMoreRef.current = hasMore;
    }, [hasMore]);

    const fetchProducts = useCallback(async (pageNum: number) => {
        try {
            if (fetchingRef.current || (pageNum > 1 && !hasMoreRef.current)) return;

            fetchingRef.current = true;
            if (pageNum === 1) setLoading(true);
            else setLoadingMore(true);

            const res = await fetch(`/api/shop/products?page=${pageNum}&limit=${ITEMS_PER_PAGE}`);
            if (!res.ok) throw new Error('Failed to fetch products');

            const data = await res.json();

            setProducts(prev => {
                const combined = pageNum === 1 ? data.products : [...prev, ...data.products];
                const uniqueIds = new Set();
                return (combined as ShopProduct[]).filter(item => {
                    if (uniqueIds.has(item.id)) return false;
                    uniqueIds.add(item.id);
                    return true;
                });
            });
            setHasMore(data.hasMore);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Gagal memuat produk');
        } finally {
            setLoading(false);
            setLoadingMore(false);
            fetchingRef.current = false;
        }
    }, []);

    // Only fetch more pages (page > 1), initial data comes from SSR
    useEffect(() => {
        if (page > 1) {
            fetchProducts(page);
        }
    }, [page, fetchProducts]);

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
            <PromoSlider initialBanners={initialBanners} />

            {/* Categories */}
            <div className="px-4 py-3">
                <div className="grid grid-cols-5 gap-y-6 gap-x-2">
                    {categories.slice(0, 9).map((category) => (
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
                                        description={product.description || undefined}
                                        isGrid={true}
                                        variants={product.variants}
                                        showPromoFirst={true}
                                        hideDescription={true}
                                        stockStatus={product.stockStatus}
                                        stock={product.stock}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Semua Produk */}
            <div className="px-4 pb-32">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-stone-900 text-lg font-bold">Semua Produk</h2>
                </div>
                <div className="flex flex-col gap-4">
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
                                    description={product.description || undefined}
                                    layout="horizontal"
                                    variants={product.variants}
                                    stockStatus={product.stockStatus}
                                    stock={product.stock}
                                />
                            </div>
                        );
                    })}
                </div>

                {loadingMore && (
                    <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-orange-500" size={24} />
                    </div>
                )}

                {!hasMore && products.length > 0 && (
                    <div className="py-12 text-center">
                        <p className="text-stone-300 text-[10px] font-bold uppercase tracking-widest italic">
                            ✨ Itu semua koleksi kami ✨
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
