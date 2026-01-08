'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin, ChevronRight, Trash2, Minus, Plus, ArrowRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

const shippingFee = 15000;

export default function CartPage() {
    const { items: cartItems, removeItem, updateQuantity, itemCount, subtotal } = useCart();

    const handleQuantityChange = (id: string, delta: number) => {
        const item = cartItems.find(i => i.id === id);
        if (item) {
            updateQuantity(id, item.quantity + delta);
        }
    };

    const total = subtotal + (cartItems.length > 0 ? shippingFee : 0);

    return (
        <>
            {/* Header */}
            <div className="sticky top-0 z-50 flex items-center bg-white/90 backdrop-blur-md px-4 py-3 shadow-sm justify-between">
                <Link href="/shop" className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-orange-50 cursor-pointer">
                    <ArrowLeft size={24} />
                </Link>
                <h2 className="text-stone-900 text-lg font-bold flex-1 text-center pr-10">Keranjang Belanja</h2>
            </div>

            {/* Shipping Address */}
            <div className="mt-4 mx-4">
                <div className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-orange-50">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="text-teal-600 flex items-center justify-center rounded-full bg-teal-100 shrink-0 size-10">
                            <MapPin size={20} />
                        </div>
                        <div className="flex flex-col justify-center">
                            <p className="text-stone-900 text-sm font-semibold line-clamp-1">Alamat Pengiriman</p>
                            <p className="text-gray-500 text-xs line-clamp-1">Jl. Melati No. 12, Jakarta Selatan</p>
                        </div>
                    </div>
                    <div className="shrink-0 text-gray-400">
                        <ChevronRight size={24} />
                    </div>
                </div>
            </div>

            {/* Cart Items Header */}
            <div className="px-4 pb-2 pt-6 flex justify-between items-end">
                <h3 className="text-stone-900 text-lg font-bold">Daftar Pesanan</h3>
                <span className="text-sm text-teal-600 font-medium">{itemCount} Item</span>
            </div>

            {/* Cart Items */}
            {cartItems.length === 0 ? (
                <div className="mx-4 mt-2 p-8 bg-white rounded-xl border border-orange-50 text-center">
                    <p className="text-gray-500">Keranjang belanja kosong</p>
                    <Link href="/shop" className="text-orange-500 font-bold mt-2 inline-block">
                        Belanja Sekarang
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-3 mx-4 mt-2">
                    {cartItems.map((item) => (
                        <div key={item.id} className="flex flex-col bg-white rounded-xl p-4 shadow-sm border border-orange-50">
                            <div className="flex gap-4">
                                {/* Product Image */}
                                <div className="relative rounded-lg size-20 shrink-0 border border-gray-100 overflow-hidden">
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>

                                {/* Product Info */}
                                <div className="flex flex-1 flex-col justify-between h-20">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-stone-900 text-base font-semibold leading-snug line-clamp-2">{item.name}</p>
                                            <p className="text-gray-500 text-xs mt-1">{item.variant}</p>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1 -mr-2 -mt-2"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>

                                    <div className="flex justify-between items-end">
                                        <p className="text-orange-500 text-sm font-bold">
                                            Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                                        </p>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-3 bg-stone-50 rounded-full px-2 py-1">
                                            <button
                                                onClick={() => handleQuantityChange(item.id, -1)}
                                                disabled={item.quantity <= 1}
                                                className="flex items-center justify-center size-6 rounded-full bg-white shadow-sm hover:bg-orange-50 transition-colors disabled:opacity-50"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => handleQuantityChange(item.id, 1)}
                                                className="flex items-center justify-center size-6 rounded-full bg-orange-500 text-white shadow-sm hover:bg-orange-600 transition-colors"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Divider */}
            <div className="mx-4 my-6 h-px bg-gray-200"></div>

            {/* Payment Summary */}
            <div className="px-4 pb-32">
                <h3 className="text-stone-900 text-lg font-bold mb-4">Rincian Pembayaran</h3>
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Subtotal Produk</span>
                        <span className="font-medium text-stone-900">Rp {subtotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Biaya Pengiriman</span>
                        <span className="font-medium text-stone-900">Rp {shippingFee.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Biaya Layanan</span>
                        <span className="font-medium text-teal-600">Gratis</span>
                    </div>
                    <div className="my-2 border-t border-dashed border-gray-300"></div>
                    <div className="flex justify-between items-center text-base font-bold">
                        <span className="text-stone-900">Total Pembayaran</span>
                        <span className="text-stone-900">Rp {total.toLocaleString('id-ID')}</span>
                    </div>
                </div>
            </div>

            {/* Checkout Bar */}
            <div className="fixed bottom-16 left-0 w-full bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] px-4 py-4 z-40">
                <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 font-medium">Total Belanja</span>
                        <span className="text-xl font-bold text-stone-900">Rp {total.toLocaleString('id-ID')}</span>
                    </div>
                    <Link
                        href="/shop/checkout"
                        className="flex-1 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] transition-all h-12 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-300/30"
                    >
                        <span className="text-white font-bold text-base">Lanjut Checkout</span>
                        <ArrowRight className="text-white" size={20} />
                    </Link>
                </div>
            </div>
        </>
    );
}
