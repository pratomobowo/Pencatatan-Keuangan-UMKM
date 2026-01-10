'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Plus, Check } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useState, useMemo } from 'react';
import { ProductVariant } from '@/lib/types';

interface ProductCardProps {
    id: string;
    slug?: string;
    name: string;
    unit: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    image: string;
    badge?: string;
    isGrid?: boolean; // For grid layout (full width)
    layout?: 'grid' | 'horizontal';
    variants?: ProductVariant[];
}

export const ProductCard: React.FC<ProductCardProps> = ({
    id,
    slug,
    name,
    unit: defaultUnit,
    price: defaultPrice,
    originalPrice,
    discount,
    image,
    badge,
    isGrid = false,
    layout = 'grid',
    variants = []
}) => {
    const { addItem } = useCart();
    const [added, setAdded] = useState(false);

    // Final layout decision: if explicit layout is provided use it, otherwise use isGrid
    const currentLayout = layout === 'horizontal' ? 'horizontal' : 'grid';

    // Find the cheapest variant
    const selectedVariant = useMemo(() => {
        if (!variants || variants.length === 0) return null;
        return [...variants].sort((a, b) => Number(a.price) - Number(b.price))[0];
    }, [variants]);

    // Current display values
    const currentPrice = selectedVariant ? Number(selectedVariant.price) : defaultPrice;
    const currentUnit = selectedVariant ? selectedVariant.unit : defaultUnit;

    const handleAddToCart = () => {
        addItem({
            id,
            name,
            variant: currentUnit,
            price: currentPrice,
            originalPrice: originalPrice || currentPrice,
            image,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    };

    if (currentLayout === 'horizontal') {
        return (
            <div className="flex bg-white rounded-2xl overflow-hidden border border-orange-50 shadow-sm relative group w-full h-32">
                {/* Product Image - Left */}
                <Link href={`/products/${slug || id}`} className="relative w-32 shrink-0 bg-gray-50 border-r border-orange-50 overflow-hidden">
                    {discount && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10">
                            {discount}%
                        </div>
                    )}
                    <Image
                        src={image}
                        alt={name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                </Link>

                {/* Product Info - Right */}
                <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                    <div className="space-y-0.5">
                        <Link href={`/products/${slug || id}`}>
                            <h3 className="text-sm font-bold text-stone-900 truncate">{name}</h3>
                        </Link>
                        <p className="text-[10px] text-stone-500 font-medium tracking-wide flex items-center gap-1.5">
                            <span className="bg-stone-50 px-1.5 py-0.5 rounded">Per {currentUnit}</span>
                        </p>
                    </div>

                    <div className="flex items-end justify-between gap-2">
                        <div className="flex flex-col">
                            {originalPrice && (
                                <span className="text-[10px] text-stone-400 line-through">
                                    Rp {originalPrice.toLocaleString('id-ID')}
                                </span>
                            )}
                            <span className="text-base font-bold text-orange-600">
                                Rp {currentPrice.toLocaleString('id-ID')}
                            </span>
                        </div>

                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAddToCart();
                            }}
                            className={`h-9 px-4 rounded-xl text-white text-xs font-bold active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5 ${added ? 'bg-green-500' : 'bg-orange-500 hover:bg-orange-600'
                                }`}
                        >
                            {added ? <Check size={16} /> : <Plus size={16} />}
                            <span className="hidden xs:inline">{added ? 'Beres' : 'Beli'}</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col bg-white rounded-xl overflow-hidden border border-orange-50 shadow-sm relative group ${isGrid ? 'w-full' : 'min-w-[160px] w-[160px] shrink-0'}`}>
            <Link
                href={`/products/${slug || id}`}
                className="block"
            >
                {/* Discount Badge */}
                {discount && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm z-10">
                        {discount}% OFF
                    </div>
                )}

                {/* Product Image */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    <Image
                        src={image}
                        alt={name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                </div>
            </Link>

            {/* Product Info */}
            <div className="p-3 flex flex-col gap-1 flex-1">
                <Link href={`/products/${slug || id}`}>
                    <h3 className="text-sm font-semibold text-stone-900 line-clamp-2 min-h-[40px]">{name}</h3>
                </Link>

                {/* Display Unit */}
                <p className="text-xs text-stone-500">Per {currentUnit}</p>

                {/* Price */}
                <div className="flex flex-col mt-auto pt-2">
                    {originalPrice && (
                        <span className="text-xs text-stone-400 line-through">
                            Rp {originalPrice.toLocaleString('id-ID')}
                        </span>
                    )}
                    <span className="text-base font-semibold text-orange-500">
                        Rp {currentPrice.toLocaleString('id-ID')}
                    </span>
                </div>

                {/* Add to Cart Button */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddToCart();
                    }}
                    className={`mt-2 w-full h-8 rounded-lg text-white text-sm font-semibold active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1 ${added ? 'bg-orange-600' : 'bg-orange-500 hover:bg-orange-600'
                        }`}
                >
                    {added ? (
                        <>
                            <Check size={16} />
                            Ditambahkan
                        </>
                    ) : (
                        <>
                            <Plus size={16} />
                            Keranjang
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
