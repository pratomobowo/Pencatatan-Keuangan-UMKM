import React from 'react';
import { X, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { ProductVariant } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';

interface ProductVariantModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: {
        id: string;
        name: string;
        image: string;
        price: number; // Base/Default price
    };
    variants: ProductVariant[];
}

export const ProductVariantModal: React.FC<ProductVariantModalProps> = ({
    isOpen,
    onClose,
    product,
    variants
}) => {
    const { addItem } = useCart();

    if (!isOpen) return null;

    const handleAddVariant = (variant: ProductVariant) => {
        addItem({
            id: product.id,
            name: product.name,
            variant: variant.unit,
            price: Number(variant.price),
            originalPrice: Number(variant.price), // Variants usually don't have separate original price stored yet, using price as base
            image: product.image,
        });
        onClose();
    };

    // Sort variants by price ascending
    const sortedVariants = [...variants].sort((a, b) => Number(a.price) - Number(b.price));

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-stone-100 flex items-center justify-between">
                    <h3 className="text-stone-900 font-bold text-lg leading-tight">{product.name}</h3>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4">
                    <p className="text-sm text-stone-600 mb-4 font-bold">Pilih ukuran/varian yang diinginkan:</p>

                    <div className="flex flex-col gap-2.5">
                        {sortedVariants.map((variant, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddVariant(variant);
                                }}
                                className="flex items-center justify-between p-3 rounded-xl border border-stone-200 hover:border-orange-500 hover:bg-orange-50 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                        {variant.unit.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="font-bold text-stone-800 text-sm group-hover:text-orange-700">{variant.unit}</span>
                                        {variant.isDefault && (
                                            <span className="text-[10px] text-green-600 font-medium bg-green-50 px-1.5 rounded">Rekomendasi</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-stone-900 text-sm group-hover:text-orange-700">
                                        Rp {Number(variant.price).toLocaleString('id-ID')}
                                    </span>
                                    <div className="p-1.5 rounded-full bg-stone-100 text-stone-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                        <ShoppingBag size={14} />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
