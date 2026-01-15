'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Plus, Check } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useState, useMemo } from 'react';
import { ProductVariant } from '@/lib/types';
import { ProductVariantModal } from './ProductVariantModal';

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
    description?: string;
    isGrid?: boolean; // For grid layout (full width)
    layout?: 'grid' | 'horizontal';
    variants?: ProductVariant[];
    showPromoFirst?: boolean; // If true, show promo price even if there's a cheaper variant
    hideDescription?: boolean; // If true, hide the short description
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
    description,
    isGrid = false,
    layout = 'grid',
    variants = [],
    showPromoFirst = false,
    hideDescription = false
}) => {
    const { addItem } = useCart();
    const [added, setAdded] = useState(false);
    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);

    // Final layout decision: if explicit layout is provided use it, otherwise use isGrid
    const currentLayout = layout === 'horizontal' ? 'horizontal' : 'grid';

    // Find the variant preference: promo first if explicitly asked, otherwise cheapest
    const selectedVariant = useMemo(() => {
        if (!variants || variants.length === 0) return null;
        // If showPromoFirst is true AND we have an original price (meaning this is the promo item),
        // we return null to use the default props (which carry the promo price/unit).
        if (showPromoFirst && originalPrice) return null;
        return [...variants].sort((a, b) => Number(a.price) - Number(b.price))[0];
    }, [variants, showPromoFirst, originalPrice]);

    // Current display values
    const currentPrice = selectedVariant ? Number(selectedVariant.price) : defaultPrice;
    const currentUnit = selectedVariant ? selectedVariant.unit : defaultUnit;

    const handleAddToCart = () => {
        // If product has variants, open selection modal instead of auto-adding
        if (variants && variants.length > 0) {
            setIsVariantModalOpen(true);
            return;
        }

        addItem({
            id,
            name,
            variant: currentUnit,
            price: currentPrice,
            originalPrice: (!selectedVariant || selectedVariant.isDefault) ? (originalPrice || currentPrice) : currentPrice,
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
                    {originalPrice && (!selectedVariant || selectedVariant.isDefault) && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10">
                            {discount || Math.round((1 - (defaultPrice / originalPrice)) * 100)}%
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
                        {!hideDescription && (
                            <p className={`text-[10px] line-clamp-2 ${description ? 'text-stone-500 font-medium' : 'text-stone-400 italic'}`}>
                                {description || "Deskripsi produk belum ditambahkan minsar, maaf ya buibu"}
                            </p>
                        )}
                        {variants && variants.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {variants.map((v, i) => (
                                    <span key={i} className="text-[8px] uppercase font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-100 shadow-[0_1px_2px_rgba(249,115,22,0.05)]">
                                        {v.unit}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-end justify-between gap-2">
                        <div className="flex flex-col">
                            {originalPrice && (!selectedVariant || selectedVariant.isDefault) && (
                                <span className="text-[10px] text-stone-400 line-through">
                                    Rp {originalPrice.toLocaleString('id-ID')}/{currentUnit}
                                </span>
                            )}
                            <div className="flex items-baseline gap-0.5 text-orange-600">
                                <span className="text-base font-bold">
                                    Rp {currentPrice.toLocaleString('id-ID')}
                                </span>
                                <span className="text-[10px] font-medium opacity-70">/{currentUnit}</span>
                            </div>
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

                {/* Variant Selection Modal */}
                <ProductVariantModal
                    isOpen={isVariantModalOpen}
                    onClose={() => setIsVariantModalOpen(false)}
                    product={{
                        id,
                        name,
                        image,
                        price: defaultPrice
                    }}
                    variants={variants}
                />
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
                {originalPrice && (!selectedVariant || selectedVariant.isDefault) && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm z-10">
                        {discount || Math.round((1 - (defaultPrice / originalPrice)) * 100)}% Hemat
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

                {!hideDescription && (
                    <p className={`text-[10px] line-clamp-2 mb-1 ${description ? 'text-stone-500 font-medium' : 'text-stone-400 italic'}`}>
                        {description || "Deskripsi produk belum ditambahkan minsar, maaf ya buibu"}
                    </p>
                )}

                {variants && variants.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {variants.map((v, i) => (
                            <span key={i} className="text-[8px] uppercase font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-100 shadow-[0_1px_2px_rgba(249,115,22,0.05)]">
                                {v.unit}
                            </span>
                        ))}
                    </div>
                )}

                {/* Price & Unit */}
                <div className="flex flex-col mt-auto pt-2">
                    {originalPrice && (!selectedVariant || selectedVariant.isDefault) && (
                        <span className="text-xs text-stone-400 line-through">
                            Rp {originalPrice.toLocaleString('id-ID')}/{currentUnit}
                        </span>
                    )}
                    <div className="flex items-baseline gap-0.5 text-orange-500">
                        <span className="text-base font-semibold">
                            Rp {currentPrice.toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs font-medium opacity-70">/{currentUnit}</span>
                    </div>
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

            {/* Variant Selection Modal */}
            <ProductVariantModal
                isOpen={isVariantModalOpen}
                onClose={() => setIsVariantModalOpen(false)}
                product={{
                    id,
                    name,
                    image,
                    price: defaultPrice
                }}
                variants={variants}
            />
        </div>
    );
};
