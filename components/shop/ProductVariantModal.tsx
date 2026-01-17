import React from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { ProductVariant } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';

interface ProductVariantModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: {
        id: string;
        name: string;
        image: string;
        price: number; // Current display price (could be promo price)
        originalPrice?: number; // Original price if on promo
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

    // Check if product is on promo (has originalPrice different from current price)
    const isPromoProduct = product.originalPrice && product.originalPrice > product.price;

    // Helper to get display price for a variant
    const getVariantDisplayPrice = (variant: ProductVariant) => {
        if (isPromoProduct && variant.isDefault) {
            return product.price; // Use promo price for default variant
        }
        return Number(variant.price);
    };

    // Helper to get original price for a variant (for strikethrough)
    const getVariantOriginalPrice = (variant: ProductVariant) => {
        if (isPromoProduct && variant.isDefault) {
            return product.originalPrice;
        }
        return null; // No original price to show
    };

    const handleAddVariant = (variant: ProductVariant) => {
        const isDefaultVariant = variant.isDefault;
        const usePromoPrice = isPromoProduct && isDefaultVariant;

        const price = usePromoPrice ? product.price : Number(variant.price);
        const originalPrice = usePromoPrice ? product.originalPrice : Number(variant.price);

        addItem({
            id: product.id,
            name: product.name,
            variant: variant.unit,
            price: price,
            originalPrice: originalPrice,
            isPromo: !!usePromoPrice,
            image: product.image,
        });
        onClose();
    };

    // Sort variants: default first, then by price
    const sortedVariants = [...variants].sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return Number(a.price) - Number(b.price);
    });

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
                        {sortedVariants.map((variant, idx) => {
                            const displayPrice = getVariantDisplayPrice(variant);
                            const origPrice = getVariantOriginalPrice(variant);
                            const hasDiscount = origPrice && origPrice > displayPrice;

                            return (
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
                                        <div className="text-right">
                                            {hasDiscount && (
                                                <span className="text-xs text-stone-400 line-through block">
                                                    Rp {origPrice.toLocaleString('id-ID')}
                                                </span>
                                            )}
                                            <span className={`font-bold text-sm group-hover:text-orange-700 ${hasDiscount ? 'text-orange-600' : 'text-stone-900'}`}>
                                                Rp {displayPrice.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <div className="p-1.5 rounded-full bg-stone-100 text-stone-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                            <ShoppingBag size={14} />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
