'use client';

import Image from 'next/image';
import { Plus } from 'lucide-react';

interface ProductCardProps {
    id: string;
    name: string;
    unit: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    image: string;
    badge?: string;
    onAddToCart?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
    name,
    unit,
    price,
    originalPrice,
    discount,
    image,
    badge,
    onAddToCart,
}) => {
    return (
        <div className="flex flex-col min-w-[160px] w-[160px] bg-white rounded-xl overflow-hidden border border-orange-50 shadow-sm relative group">
            {/* Discount Badge */}
            {discount && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10">
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

            {/* Product Info */}
            <div className="p-3 flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-stone-900 line-clamp-2 min-h-[40px]">{name}</h3>
                <p className="text-xs text-stone-500">{unit}</p>

                {/* Price */}
                <div className="flex flex-col mt-1">
                    {originalPrice && (
                        <span className="text-xs text-stone-400 line-through">
                            Rp {originalPrice.toLocaleString('id-ID')}
                        </span>
                    )}
                    <span className="text-base font-bold text-orange-500">
                        Rp {price.toLocaleString('id-ID')}
                    </span>
                </div>

                {/* Add to Cart Button */}
                <button
                    onClick={onAddToCart}
                    className="mt-2 w-full h-8 rounded-lg bg-teal-400 text-white text-sm font-bold hover:bg-teal-500 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1"
                >
                    <Plus size={16} />
                    Keranjang
                </button>
            </div>
        </div>
    );
};
