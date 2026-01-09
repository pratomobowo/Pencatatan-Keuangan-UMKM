'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Plus, Check, ChevronDown } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useState, useMemo } from 'react';
import { ProductVariant } from '@/lib/types';

interface ProductCardProps {
    id: string;
    name: string;
    unit: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    image: string;
    badge?: string;
    isGrid?: boolean; // For grid layout (full width)
    variants?: ProductVariant[];
}

export const ProductCard: React.FC<ProductCardProps> = ({
    id,
    name,
    unit: defaultUnit,
    price: defaultPrice,
    originalPrice,
    discount,
    image,
    badge,
    isGrid = false,
    variants = []
}) => {
    const { addItem } = useCart();
    const [added, setAdded] = useState(false);

    // Sort variants to have default first, or use provided order
    const sortedVariants = useMemo(() => {
        if (!variants || variants.length === 0) return [];
        return [...variants].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
    }, [variants]);

    // Initialize with default variant if exists, otherwise use props
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
        sortedVariants.length > 0 ? sortedVariants[0] : null
    );

    // Current display values
    const currentPrice = selectedVariant ? Number(selectedVariant.price) : defaultPrice;
    const currentUnit = selectedVariant ? selectedVariant.unit : defaultUnit;

    const handleAddToCart = () => {
        addItem({
            id,
            name,
            variant: currentUnit,
            price: currentPrice,
            image,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    };

    return (
        <div className={`flex flex-col bg-white rounded-xl overflow-hidden border border-orange-50 shadow-sm relative group ${isGrid ? 'w-full' : 'min-w-[160px] w-[160px] shrink-0'}`}>
            <Link
                href={`/products/${id}`}
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
                <Link href={`/products/${id}`}>
                    <h3 className="text-sm font-semibold text-stone-900 line-clamp-2 min-h-[40px]">{name}</h3>
                </Link>

                {/* Variant Selector or Static Unit */}
                {sortedVariants.length > 1 ? (
                    <div className="relative mt-1">
                        <select
                            value={selectedVariant?.id}
                            onChange={(e) => {
                                const v = sortedVariants.find(v => v.id === e.target.value);
                                if (v) setSelectedVariant(v);
                            }}
                            className="w-full text-xs p-1 pr-6 bg-slate-50 border border-slate-200 rounded appearance-none cursor-pointer focus:outline-none focus:border-orange-300 text-slate-600 font-medium"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {sortedVariants.map(v => (
                                <option key={v.id} value={v.id}>{v.unit}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1.5 text-slate-400 pointer-events-none" size={12} />
                    </div>
                ) : (
                    <p className="text-xs text-stone-500">{currentUnit}</p>
                )}

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
                    className={`mt-2 w-full h-8 rounded-lg text-white text-sm font-semibold active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1 ${added ? 'bg-green-500' : 'bg-teal-400 hover:bg-teal-500'
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
