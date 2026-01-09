'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Heart, Truck, Shield, Thermometer, Check, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

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

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [added, setAdded] = useState(false);
    const { addItem } = useCart();

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/products/${id}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Produk tidak ditemukan');
                }
                throw new Error('Failed to fetch product');
            }
            const data = await response.json();
            setProduct(data);
        } catch (err: any) {
            console.error('Error fetching product:', err);
            setError(err.message || 'Gagal memuat produk');
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (delta: number) => {
        setQuantity(Math.max(1, quantity + delta));
    };

    const handleAddToCart = () => {
        if (!product) return;

        addItem({
            id: product.id,
            name: product.name,
            variant: product.unit,
            price: product.price,
            image: product.image || DEFAULT_IMAGE,
        }, quantity);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-orange-500" size={40} />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4">
                <p className="text-red-500 mb-4">{error || 'Produk tidak ditemukan'}</p>
                <Link
                    href="/shop"
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg"
                >
                    Kembali ke Beranda
                </Link>
            </div>
        );
    }

    const productImage = product.image || DEFAULT_IMAGE;
    const isInStock = product.stock > 0;

    return (
        <>
            {/* Image Gallery */}
            <div className="relative w-full aspect-[4/3] bg-stone-100">
                <Image
                    src={productImage}
                    alt={product.name}
                    fill
                    className="object-cover"
                />

                {/* Favorite Button */}
                <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="absolute top-4 right-4 size-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transition-colors"
                >
                    <Heart size={24} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
                </button>

                {/* Back Button */}
                <Link
                    href="/shop"
                    className="absolute top-4 left-4 size-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-700" />
                </Link>
            </div>

            {/* Product Info */}
            <div className="px-5 pt-6 bg-white rounded-t-3xl -mt-6 relative z-10">
                <div className="flex items-start justify-between gap-4">
                    <div className="w-full">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${isInStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {isInStock ? `Stok: ${product.stock}` : 'Stok Habis'}
                            </span>
                            {product.category && (
                                <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600">
                                    {product.category}
                                </span>
                            )}
                        </div>
                        <h1 className="text-stone-900 text-2xl font-bold leading-tight mb-1">{product.name}</h1>
                        <p className="text-gray-500 text-sm">{product.unit}</p>
                    </div>
                </div>

                <div className="mt-4 flex items-end gap-2 border-b border-orange-100 pb-6">
                    <h2 className="text-orange-500 text-3xl font-bold">
                        Rp {product.price.toLocaleString('id-ID')}
                    </h2>
                    <span className="text-gray-400 mb-1.5 text-base font-medium">/ {product.unit}</span>
                </div>
            </div>

            {/* Add to Cart Section */}
            <div className="px-5 pt-4 pb-6 bg-white border-b border-orange-100">
                <div className="flex items-center gap-4">
                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between bg-stone-50 border border-orange-100 rounded-xl h-12 w-32 px-3 shrink-0">
                        <button
                            onClick={() => handleQuantityChange(-1)}
                            disabled={quantity <= 1}
                            className="size-7 flex items-center justify-center text-gray-400 hover:text-stone-900 active:scale-90 transition-transform disabled:opacity-50"
                        >
                            <span className="text-lg">−</span>
                        </button>
                        <span className="text-base font-bold text-stone-900">{quantity}</span>
                        <button
                            onClick={() => handleQuantityChange(1)}
                            disabled={quantity >= product.stock}
                            className="size-7 flex items-center justify-center text-orange-500 active:scale-90 transition-transform disabled:opacity-50"
                        >
                            <span className="text-lg">+</span>
                        </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                        onClick={handleAddToCart}
                        disabled={!isInStock}
                        className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-300/40 transition-all active:scale-[0.98] ${added
                                ? 'bg-green-500'
                                : isInStock
                                    ? 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700'
                                    : 'bg-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {added ? (
                            <>
                                <Check className="text-white" size={20} />
                                <span className="text-white font-bold">Ditambahkan!</span>
                            </>
                        ) : (
                            <>
                                <ShoppingBag className="text-white" size={20} />
                                <span className="text-white font-bold">+ Keranjang</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Delivery Info */}
            <div className="px-5 mt-6 bg-white">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 items-start">
                    <div className="bg-blue-200 rounded-full p-2 shrink-0 text-blue-600">
                        <Truck size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-stone-900 mb-0.5">Dikirim besok pagi</p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            Pesan sebelum jam 20:00 untuk pengiriman besok pukul 06:00 - 09:00.
                        </p>
                    </div>
                </div>
            </div>

            {/* Description */}
            {product.description && (
                <div className="px-5 pt-6 pb-4 bg-white">
                    <h3 className="text-stone-900 text-lg font-bold mb-3">Tentang Produk</h3>
                    <p className="text-gray-600 text-[15px] leading-7 whitespace-pre-line">
                        {product.description}
                    </p>
                </div>
            )}

            {/* Features */}
            <div className="px-5 py-4 border-t border-orange-100 bg-white">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-xl border border-orange-50">
                        <Shield className="text-green-600" size={24} />
                        <div>
                            <p className="text-xs font-bold text-stone-900">Dijamin Segar</p>
                            <p className="text-[10px] text-gray-500">Uang kembali 100%</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-xl border border-orange-50">
                        <Thermometer className="text-blue-500" size={24} />
                        <div>
                            <p className="text-xs font-bold text-stone-900">Suhu Terjaga</p>
                            <p className="text-[10px] text-gray-500">Dikirim ice gel</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Padding for BottomNav */}
            <div className="h-24 bg-white"></div>
        </>
    );
}
