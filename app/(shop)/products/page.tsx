'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, Loader2, X } from 'lucide-react';
import { ProductCard } from '@/components/shop/ProductCard';

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
    { id: 'all', name: 'Semua' },
    { id: 'ikan-laut', name: 'Ikan Laut' },
    { id: 'seafood', name: 'Seafood' },
    { id: 'ayam', name: 'Ayam & Telur' },
    { id: 'daging-sapi', name: 'Daging Sapi' },
    { id: 'bumbu', name: 'Bumbu' },
];

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';

function ProductsContent() {
    const searchParams = useSearchParams();
    const categoryParam = searchParams.get('category');

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, [selectedCategory, searchQuery]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            let url = '/api/products?';

            if (selectedCategory && selectedCategory !== 'all') {
                url += `category=${selectedCategory}&`;
            }
            if (searchQuery) {
                url += `search=${encodeURIComponent(searchQuery)}&`;
            }

            const response = await fetch(url);
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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchProducts();
    };

    return (
        <>
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm">
                <div className="flex items-center px-4 py-3 justify-between">
                    <Link href="/shop" className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-orange-50">
                        <ArrowLeft size={24} />
                    </Link>
                    <h2 className="text-stone-900 text-lg font-bold flex-1 text-center">
                        {selectedCategory === 'all' ? 'Semua Produk' : categories.find(c => c.id === selectedCategory)?.name || 'Produk'}
                    </h2>
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-orange-50"
                    >
                        {showSearch ? <X size={24} /> : <Search size={24} />}
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
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.id
                                ? 'bg-orange-500 text-white'
                                : 'bg-stone-100 text-gray-600 hover:bg-stone-200'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </header>

            {/* Content */}
            <main className="p-4 pb-24">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-orange-500" size={40} />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <p className="text-red-500 mb-4">{error}</p>
                        <button
                            onClick={fetchProducts}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg"
                        >
                            Coba Lagi
                        </button>
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <p className="text-gray-500 mb-2">Tidak ada produk ditemukan</p>
                        {searchQuery && (
                            <p className="text-sm text-gray-400">
                                Coba kata kunci lain atau hapus filter
                            </p>
                        )}
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-gray-500 mb-4">{products.length} produk ditemukan</p>
                        <div className="grid grid-cols-2 gap-4">
                            {products.map((product) => (
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
                    </>
                )}
            </main>
        </>
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
