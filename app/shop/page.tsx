'use client';

import { ProductCard } from '@/components/shop/ProductCard';
import { CategoryIcon } from '@/components/shop/CategoryIcon';
import { PromoSlider } from '@/components/shop/PromoSlider';
import { Fish, Beef, Egg, Leaf, Waves } from 'lucide-react';
import Link from 'next/link';

// Mock data - will be replaced with API calls later
const promoProducts = [
    {
        id: '1',
        name: 'Udang Vaname Segar',
        unit: '500 gram',
        price: 44000,
        originalPrice: 55000,
        discount: 20,
        image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&q=80',
    },
    {
        id: '2',
        name: 'Dada Ayam Fillet',
        unit: '1 kg',
        price: 54000,
        originalPrice: 60000,
        discount: 10,
        image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=80',
    },
    {
        id: '3',
        name: 'Ikan Kakap Merah',
        unit: '1 Ekor (700g)',
        price: 72250,
        originalPrice: 85000,
        discount: 15,
        image: 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=400&q=80',
    },
];

const featuredProducts = [
    {
        id: '4',
        name: 'Daging Sapi Rendang',
        unit: '1 kg',
        price: 120000,
        image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400&q=80',
        badge: 'DIJAMIN SEGAR',
    },
    {
        id: '5',
        name: 'Ayam Utuh Karkas',
        unit: '0.8 - 1.0 kg',
        price: 45000,
        image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&q=80',
    },
    {
        id: '6',
        name: 'Salmon Trout Fillet',
        unit: '200 gram',
        price: 65000,
        image: 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=400&q=80',
    },
    {
        id: '7',
        name: 'Paket Sayur Sop',
        unit: '1 Pack',
        price: 15000,
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80',
    },
];

const categories = [
    { name: 'Ikan Laut', icon: Fish, href: '/shop/products?category=ikan-laut', color: 'text-blue-400' },
    { name: 'Seafood', icon: Waves, href: '/shop/products?category=seafood', color: 'text-orange-500' },
    { name: 'Ayam & Telur', icon: Egg, href: '/shop/products?category=ayam', color: 'text-yellow-500' },
    { name: 'Daging Sapi', icon: Beef, href: '/shop/products?category=daging-sapi', color: 'text-red-400' },
    { name: 'Bumbu', icon: Leaf, href: '/shop/products?category=bumbu', color: 'text-teal-400' },
];

export default function ShopHomepage() {
    const handleAddToCart = (productId: string) => {
        console.log('Add to cart:', productId);
        // Will implement cart functionality later
    };

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

            {/* Promo Products */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-4">
                    <h2 className="text-stone-900 text-lg font-bold">Promo Hari Ini 🔥</h2>
                    <Link href="/shop/products?promo=true" className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                        Lihat Semua
                    </Link>
                </div>
                <div className="flex overflow-x-auto hide-scrollbar px-4 pb-2 gap-4">
                    {promoProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            {...product}
                            onAddToCart={() => handleAddToCart(product.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Featured Products */}
            <div className="flex flex-col gap-3 px-4 pb-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-stone-900 text-lg font-bold">Pilihan Bunda ❤️</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {featuredProducts.map((product) => (
                        <div key={product.id} className="flex flex-col bg-white rounded-xl overflow-hidden border border-orange-50 shadow-sm group">
                            {product.badge && (
                                <div className="absolute top-2 left-2 bg-green-50 text-green-700 border border-green-100 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10">
                                    {product.badge}
                                </div>
                            )}
                            <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            <div className="p-3 flex flex-col gap-1 flex-1">
                                <h3 className="text-sm font-semibold text-stone-900 line-clamp-2">{product.name}</h3>
                                <p className="text-xs text-stone-500">{product.unit}</p>
                                <div className="flex items-end justify-between mt-auto pt-2">
                                    <span className="text-base font-bold text-stone-900">
                                        Rp {product.price.toLocaleString('id-ID')}
                                    </span>
                                    <button
                                        onClick={() => handleAddToCart(product.id)}
                                        className="size-8 rounded-full bg-teal-400 flex items-center justify-center text-white hover:bg-teal-500 active:scale-95 transition-all shadow-sm"
                                    >
                                        <span className="text-lg">+</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
