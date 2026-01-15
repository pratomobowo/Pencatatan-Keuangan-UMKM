'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Heart, Truck, Shield, Thermometer, Check } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Product, ProductVariant, StockStatus } from '@/lib/types';

const DEFAULT_IMAGE = '/images/coming-soon.jpg';

interface ProductDetailClientProps {
    product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
    const router = useRouter();
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [added, setAdded] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(() => {
        if (product.variants && product.variants.length > 0) {
            return product.variants.find((v) => v.isDefault) || product.variants[0];
        }
        return null;
    });

    const { addItem } = useCart();

    // Sort variants to have default first
    const sortedVariants = useMemo(() => {
        if (!product?.variants || product.variants.length === 0) return [];
        return [...product.variants].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
    }, [product?.variants]);

    const handleQuantityChange = (delta: number) => {
        setQuantity(Math.max(1, quantity + delta));
    };

    const handleAddToCart = () => {
        if (!product) return;

        const price = selectedVariant ? Number(selectedVariant.price) : product.price;
        const unit = selectedVariant ? selectedVariant.unit : product.unit;

        addItem({
            id: product.id,
            name: product.name,
            variant: unit,
            price: price,
            originalPrice: (!selectedVariant || selectedVariant.isDefault) ? (product.originalPrice || price) : price,
            image: product.image || DEFAULT_IMAGE,
        }, quantity);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    };

    const productImage = product.image || DEFAULT_IMAGE;
    const stockStatus = product.stockStatus || StockStatus.FINITE;
    const isInStock = stockStatus === StockStatus.ALWAYS_READY || (stockStatus === StockStatus.FINITE && product.stock > 0);

    // Determine display values based on selection
    const currentPrice = selectedVariant ? Number(selectedVariant.price) : product.price;
    const currentUnit = selectedVariant ? selectedVariant.unit : product.unit;

    return (
        <div className="min-h-screen bg-stone-50 pb-24">
            {/* Image Gallery */}
            <div className="relative w-full aspect-[4/3] bg-stone-100">
                <Image
                    src={productImage}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                />

                {/* Favorite Button */}
                <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="absolute top-4 right-4 size-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transition-colors hover:bg-white"
                >
                    <Heart size={24} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
                </button>

                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="absolute top-4 left-4 size-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transition-colors hover:bg-white"
                >
                    <ArrowLeft size={24} className="text-gray-700" />
                </button>
            </div>

            {/* Product Info */}
            <div className="px-5 pt-6 bg-white rounded-t-3xl -mt-6 relative z-10 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                    <div className="w-full">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${isInStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {isInStock ? (stockStatus === StockStatus.ALWAYS_READY ? 'Selalu Ready' : `Stok: ${product.stock}`) : 'Stok Habis'}
                            </span>
                            {product.categoryName && (
                                <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600">
                                    {product.categoryName}
                                </span>
                            )}
                        </div>
                        <h1 className="text-stone-900 text-xl font-bold leading-tight mb-1">{product.name}</h1>
                    </div>
                </div>

                {/* Variant Selector */}
                {sortedVariants.length > 0 && (
                    <div className="mt-4 mb-2">
                        <label className="text-xs font-semibold text-stone-900 mb-2 block">Pilih Satuan:</label>
                        <div className="flex flex-wrap gap-2">
                            {sortedVariants.map((variant) => (
                                <button
                                    key={variant.id}
                                    onClick={() => setSelectedVariant(variant)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${selectedVariant?.id === variant.id
                                        ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-orange-200'
                                        }`}
                                >
                                    {variant.unit}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-4 flex flex-col gap-1 border-b border-orange-100 pb-6">
                    {product.originalPrice && (!selectedVariant || selectedVariant.isDefault) && (
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 line-through text-base font-medium">
                                Rp {product.originalPrice.toLocaleString('id-ID')}
                            </span>
                            {product.price < product.originalPrice && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                    HEMAT {Math.round((1 - (product.price / product.originalPrice)) * 100)}%
                                </span>
                            )}
                        </div>
                    )}
                    <div className="flex items-end gap-2">
                        <h2 className="text-orange-500 text-3xl font-extrabold">
                            Rp {currentPrice.toLocaleString('id-ID')}
                        </h2>
                        <span className="text-gray-400 mb-1.5 text-base font-medium">/ {currentUnit}</span>
                    </div>
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
                            disabled={stockStatus !== StockStatus.ALWAYS_READY && quantity >= product.stock}
                            className="size-7 flex items-center justify-center text-orange-500 active:scale-90 transition-transform disabled:opacity-50"
                        >
                            <span className="text-lg">+</span>
                        </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                        onClick={handleAddToCart}
                        disabled={!isInStock}
                        className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${added
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
            <div className="mt-6 mx-4">
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
                <div className="px-5 mt-4 pt-6 pb-4 bg-white rounded-2xl mx-4 shadow-sm">
                    <h3 className="text-stone-900 text-lg font-bold mb-3">Tentang Produk</h3>
                    <p className="text-gray-600 text-[15px] leading-7 whitespace-pre-line">
                        {product.description}
                    </p>
                </div>
            )}

            {/* Features */}
            <div className="px-5 py-6 bg-transparent">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-orange-50 shadow-sm">
                        <Shield className="text-green-600" size={24} />
                        <div>
                            <p className="text-xs font-bold text-stone-900">Dijamin Segar</p>
                            <p className="text-xs text-gray-500">Uang kembali 100%</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-orange-50 shadow-sm">
                        <Thermometer className="text-blue-500" size={24} />
                        <div>
                            <p className="text-xs font-bold text-stone-900">Suhu Terjaga</p>
                            <p className="text-xs text-gray-500">Tersimpan di Freezer</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
