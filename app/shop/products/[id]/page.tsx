'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Heart, Star, Truck, Shield, Thermometer, ChevronDown } from 'lucide-react';

interface ProductDetailProps {
    params: {
        id: string;
    };
}

// Mock data - will be replaced with API call
const productData = {
    id: '1',
    name: 'Ikan Salmon Fillet Premium',
    origin: 'Norwegia • Grade A Sashimi',
    price: 85000,
    unit: '500gr',
    rating: 4.8,
    reviewCount: 128,
    stock: 'Stok Tersedia',
    images: [
        'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=800&q=80',
        'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=800&q=80',
    ],
    weights: [
        { value: '500gr', price: 85000, label: '500gr' },
        { value: '1kg', price: 161500, label: '1kg', discount: 'Hemat 5%' },
        { value: '250gr', price: 45000, label: '250gr' },
    ],
    description: `Salmon segar pilihan terbaik yang kaya akan omega-3, protein, dan vitamin D. Ikan kami didatangkan langsung dari perairan dingin Norwegia untuk menjaga kualitas dan rasa.

Tekstur daging lembut dan juicy, sangat cocok untuk MPASI si kecil, menu grill keluarga di akhir pekan, atau dimasak pan-seared sederhana.`,
    features: [
        { icon: Shield, title: 'Dijamin Segar', subtitle: 'Uang kembali 100%', color: 'text-green-600' },
        { icon: Thermometer, title: 'Suhu Terjaga', subtitle: 'Dikirim ice gel', color: 'text-blue-500' },
    ],
    customerReviews: [
        {
            name: 'Sari P.',
            rating: 5,
            comment: 'Ikannya seger banget! Anakku suka, gak amis sama sekali. Packingnya juga rapi pake ice gel banyak.',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
        },
    ],
};

export default function ProductDetailPage({ params }: ProductDetailProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedWeight, setSelectedWeight] = useState(productData.weights[0]);
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);

    const handleQuantityChange = (delta: number) => {
        setQuantity(Math.max(1, quantity + delta));
    };

    const handleAddToCart = () => {
        console.log('Add to cart:', { product: productData, weight: selectedWeight, quantity });
        // Will implement cart functionality later
    };

    return (
        <>
            {/* Image Gallery */}
            <div className="relative w-full aspect-[4/3] bg-stone-100">
                <div className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
                    {productData.images.map((image, index) => (
                        <div key={index} className="flex-none w-full h-full snap-center relative">
                            <Image
                                src={image}
                                alt={productData.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                    ))}
                </div>

                {/* Favorite Button */}
                <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="absolute top-4 right-4 size-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transition-colors"
                >
                    <Heart size={24} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
                </button>

                {/* Image Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {productData.images.map((_, index) => (
                        <div
                            key={index}
                            className={`w-2 h-2 rounded-full shadow-sm ${index === currentImageIndex ? 'bg-orange-500' : 'bg-white/60'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Product Info */}
            <div className="px-5 pt-6 bg-white rounded-t-3xl -mt-6 relative z-10">
                <div className="flex items-start justify-between gap-4">
                    <div className="w-full">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-800">
                                {productData.stock}
                            </span>
                            <div className="flex items-center gap-1 text-yellow-500 bg-yellow-50 px-2 py-0.5 rounded-md">
                                <Star size={14} fill="currentColor" />
                                <span className="text-xs font-bold text-gray-700">{productData.rating}</span>
                                <span className="text-xs text-gray-400">({productData.reviewCount})</span>
                            </div>
                        </div>
                        <h1 className="text-stone-900 text-2xl font-bold leading-tight mb-1">{productData.name}</h1>
                        <p className="text-gray-500 text-sm">{productData.origin}</p>
                    </div>
                </div>

                <div className="mt-4 flex items-end gap-2 border-b border-orange-100 pb-6">
                    <h2 className="text-orange-500 text-3xl font-bold">
                        Rp {selectedWeight.price.toLocaleString('id-ID')}
                    </h2>
                    <span className="text-gray-400 mb-1.5 text-base font-medium">/ {selectedWeight.label}</span>
                </div>
            </div>

            {/* Weight Selection */}
            <div className="px-5 pt-6 bg-white">
                <h3 className="text-stone-900 text-base font-bold mb-3">Pilih Berat</h3>
                <div className="flex gap-3 flex-wrap">
                    {productData.weights.map((weight) => (
                        <button
                            key={weight.value}
                            onClick={() => setSelectedWeight(weight)}
                            className={`flex h-10 items-center justify-center gap-x-2 rounded-xl px-5 transition-all ${selectedWeight.value === weight.value
                                ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                                : 'bg-stone-50 border border-orange-100 hover:bg-orange-50 text-gray-600'
                                }`}
                        >
                            <p className={`text-sm font-bold ${selectedWeight.value === weight.value ? 'text-white' : ''}`}>
                                {weight.label}
                            </p>
                            {weight.discount && (
                                <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full font-bold">
                                    {weight.discount}
                                </span>
                            )}
                        </button>
                    ))}
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
            <div className="px-5 pt-6 pb-4 bg-white">
                <h3 className="text-stone-900 text-lg font-bold mb-3">Tentang Produk</h3>
                <p className="text-gray-600 text-[15px] leading-7 whitespace-pre-line">
                    {productData.description}
                </p>
                <div className="flex items-center gap-2 mt-4 text-orange-500 font-bold text-sm cursor-pointer hover:underline">
                    <span>Baca selengkapnya</span>
                    <ChevronDown size={16} />
                </div>
            </div>

            {/* Features */}
            <div className="px-5 py-4 border-t border-orange-100 bg-white">
                <div className="grid grid-cols-2 gap-4">
                    {productData.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 bg-stone-50 p-3 rounded-xl border border-orange-50">
                            <feature.icon className={`${feature.color} text-2xl`} size={24} />
                            <div>
                                <p className="text-xs font-bold text-stone-900">{feature.title}</p>
                                <p className="text-[10px] text-gray-500">{feature.subtitle}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Reviews */}
            <div className="px-5 pt-2 pb-6 bg-white mb-24">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-stone-900 text-lg font-bold">Ulasan Pembeli</h3>
                    <Link href="#" className="text-orange-500 text-sm font-bold hover:text-orange-600 transition-colors">
                        Lihat Semua
                    </Link>
                </div>
                <div className="flex flex-col gap-4">
                    {productData.customerReviews.map((review, index) => (
                        <div key={index} className="bg-stone-50 rounded-2xl p-4 border border-orange-50">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="size-9 rounded-full bg-orange-100 bg-center bg-cover border-2 border-white relative">
                                        <Image src={review.avatar} alt={review.name} fill className="rounded-full object-cover" />
                                    </div>
                                    <span className="text-sm font-bold text-stone-900">{review.name}</span>
                                </div>
                                <div className="flex text-yellow-400">
                                    {[...Array(review.rating)].map((_, i) => (
                                        <Star key={i} size={16} fill="currentColor" />
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed italic">"{review.comment}"</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Bar - Add to Cart */}
            <div className="fixed bottom-0 left-0 right-0 z-40 w-full bg-white border-t border-orange-100 p-4 pb-8 shadow-[0_-8px_30px_-5px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-4 max-w-md mx-auto">
                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between bg-stone-50 border border-orange-100 rounded-xl h-14 w-36 px-3 shrink-0">
                        <button
                            onClick={() => handleQuantityChange(-1)}
                            disabled={quantity <= 1}
                            className="size-8 flex items-center justify-center text-gray-400 hover:text-stone-900 active:scale-90 transition-transform disabled:opacity-50"
                        >
                            <span className="text-xl">−</span>
                        </button>
                        <span className="text-lg font-bold text-stone-900">{quantity}</span>
                        <button
                            onClick={() => handleQuantityChange(1)}
                            className="size-8 flex items-center justify-center text-orange-500 active:scale-90 transition-transform"
                        >
                            <span className="text-xl">+</span>
                        </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                        onClick={handleAddToCart}
                        className="flex-1 h-14 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-orange-300/40 transition-all active:scale-[0.98]"
                    >
                        <ShoppingBag className="text-white" size={22} />
                        <span className="text-white font-bold text-lg">+ Keranjang</span>
                    </button>
                </div>
            </div>
        </>
    );
}
