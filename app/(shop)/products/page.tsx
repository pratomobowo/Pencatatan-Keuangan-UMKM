'use client';

import { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, Loader2, X } from 'lucide-react';
import { ProductCard } from '@/components/shop/ProductCard';
import { ShopProduct, Category } from '@/lib/types';

const DEFAULT_IMAGE = '/images/coming-soon.jpg';
const ITEMS_PER_PAGE = 10;

function ProductsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');

    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'all');
    const [searchQuery, setSearchQuery] = useState(searchParam || '');
    const [showSearch, setShowSearch] = useState(!!searchParam);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);

    const fetchingRef = useRef(false);
    const hasMoreRef = useRef(true);

    useEffect(() => {
        hasMoreRef.current = hasMore;
    }, [hasMore]);

    // Update state when URL params change
    useEffect(() => {
        const cat = searchParams.get('category') || 'all';
        const q = searchParams.get('search') || '';
        setSelectedCategory(cat);
        setSearchQuery(q);
        setShowSearch(!!q);
        setPage(1); // Reset to first page on filter change
    }, [searchParams]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/shop/categories');
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    const fetchProducts = useCallback(async (pageNum: number, isInitial = false) => {
        try {
            if (fetchingRef.current || (!isInitial && pageNum > 1 && !hasMoreRef.current)) return;

            fetchingRef.current = true;
            if (isInitial) setLoading(true);
            else setLoadingMore(true);

            let url = `/api/shop/products?page=${pageNum}&limit=${ITEMS_PER_PAGE}&`;

            if (selectedCategory && selectedCategory !== 'all') {
                url += `category=${selectedCategory}&`;
            }
            if (searchQuery) {
                url += `search=${encodeURIComponent(searchQuery)}&`;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch products');
            const data = await response.json();

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
            setTotal(data.total);
        } catch (err) {
            console.error('Error fetching products:', err);
            if (pageNum === 1) setError('Gagal memuat produk');
        } finally {
            setLoading(false);
            setLoadingMore(false);
            fetchingRef.current = false;
        }
    }, [selectedCategory, searchQuery]);

    useEffect(() => {
        fetchProducts(page, page === 1);
    }, [page, fetchProducts]);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastProductElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (searchQuery) params.set('search', searchQuery);
        else params.delete('search');
        params.set('page', '1');
        router.push(`/products?${params.toString()}`);
    };

    const handleCategoryClick = (slug: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (slug === 'all') params.delete('category');
        else params.set('category', slug);
        params.set('page', '1');
        router.push(`/products?${params.toString()}`);
    };

    const categoriesList = [{ id: 'all', name: 'Semua', slug: 'all' }, ...categories];

    return (
        <div className="min-h-screen bg-stone-50">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm">
                <div className="flex items-center px-4 py-3 justify-between">
                    <Link href="/" className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-orange-50">
                        <ArrowLeft size={24} className="text-stone-600" />
                    </Link>
                    <h2 className="text-stone-900 text-lg font-bold flex-1 text-center truncate px-2">
                        {selectedCategory === 'all' ? 'Semua Produk' : categories.find(c => c.slug === selectedCategory)?.name || 'Produk'}
                    </h2>
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-orange-50"
                    >
                        {showSearch ? <X size={24} className="text-stone-600" /> : <Search size={24} className="text-stone-600" />}
                    </button>
                </div>

                {/* Search Bar */}
                {showSearch && (
                    <form onSubmit={handleSearch} className="px-4 pb-3">
                        <div className="flex items-center gap-2 bg-stone-100 rounded-xl px-4 py-2.5">
                            <Search size={20} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari produk..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent outline-none text-sm"
                                autoFocus
                            />
                            {searchQuery && (
                                <button type="button" onClick={() => setSearchQuery('')}>
                                    <X size={18} className="text-gray-400" />
                                </button>
                            )}
                        </div>
                    </form>
                )}

                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar px-4 pb-3">
                    {categoriesList.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryClick(cat.slug || 'all')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm ${selectedCategory === (cat.slug || 'all')
                                ? 'bg-orange-500 text-white'
                                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-100'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </header>

            {/* Content */}
            <main className="px-4 pt-4 pb-24">
                {loading && page === 1 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="animate-spin text-orange-500" size={40} />
                        <p className="text-stone-400 text-sm italic">Mencari stok terbaik...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                        <div className="bg-red-50 p-4 rounded-full mb-4">
                            <X className="text-red-500" size={32} />
                        </div>
                        <p className="text-stone-900 font-bold mb-1">Yah, gagal memuat</p>
                        <p className="text-stone-500 text-sm mb-6">{error}</p>
                        <button
                            onClick={() => fetchProducts(1, true)}
                            className="px-6 py-2 bg-orange-500 text-white rounded-full font-bold shadow-md active:scale-95 transition-transform"
                        >
                            Coba Lagi
                        </button>
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                        <div className="bg-stone-100 p-6 rounded-3xl mb-4">
                            <Search className="text-stone-300" size={48} />
                        </div>
                        <p className="text-stone-900 font-bold mb-1">Produk Tidak Ditemukan</p>
                        <p className="text-stone-500 text-sm">Coba kata kunci lain atau pilih kategori yang berbeda ya Bunda.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-4 px-1">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.1em]">{total} Produk Tersedia</p>
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
                                            showPromoFirst={searchParams.get('promo') === 'true'}
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

                        {!hasMore && (
                            <div className="py-12 text-center">
                                <p className="text-stone-300 text-[10px] font-bold uppercase tracking-widest italic">
                                    ✨ Kamu sudah di ujung koleksi ✨
                                </p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-orange-500" size={40} />
            </div>
        }>
            <ProductsContent />
        </Suspense>
    );
}
