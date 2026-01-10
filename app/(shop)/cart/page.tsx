'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin, ChevronRight, Trash2, Minus, Plus, ArrowRight, Loader2, Navigation } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export default function CartPage() {
    const { items: cartItems, removeItem, updateQuantity, itemCount, subtotal } = useCart();

    // Shipping state
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [shippingData, setShippingData] = useState<{
        fee: number;
        distance: number | null;
        isFreeShipping: boolean;
        isCalculating: boolean;
        error: string | null;
    }>({
        fee: 0,
        distance: null,
        isFreeShipping: false,
        isCalculating: false,
        error: null,
    });

    const handleQuantityChange = (id: string, variant: string, delta: number) => {
        const item = cartItems.find(i => i.id === id && i.variant === variant);
        if (item) {
            updateQuantity(id, variant, item.quantity + delta);
        }
    };

    const calculateShipping = async () => {
        if (!deliveryAddress.trim()) {
            setShippingData({ fee: 0, distance: null, isFreeShipping: false, isCalculating: false, error: 'Masukkan alamat pengiriman' });
            return;
        }

        setShippingData(prev => ({ ...prev, isCalculating: true, error: null }));

        try {
            // 1. Geocode address
            const geocodeRes = await fetch('/api/shop/geocode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: deliveryAddress }),
            });

            if (!geocodeRes.ok) {
                const error = await geocodeRes.json();
                throw new Error(error.message || 'Alamat tidak ditemukan');
            }

            const { latitude, longitude } = await geocodeRes.json();

            // 2. Calculate shipping
            const shippingRes = await fetch('/api/shop/calculate-shipping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude, longitude, subtotal }),
            });

            if (!shippingRes.ok) {
                throw new Error('Gagal menghitung ongkir');
            }

            const shippingResult = await shippingRes.json();

            if (shippingResult.isOutOfRange) {
                setShippingData({
                    fee: 0,
                    distance: shippingResult.distance_km,
                    isFreeShipping: false,
                    isCalculating: false,
                    error: shippingResult.message || 'Lokasi di luar jangkauan pengiriman',
                });
                return;
            }

            setShippingData({
                fee: shippingResult.shippingFee,
                distance: shippingResult.distance_km,
                isFreeShipping: shippingResult.isFreeShipping,
                isCalculating: false,
                error: null,
            });
        } catch (error: any) {
            console.error('Shipping calculation error:', error);
            setShippingData({
                fee: 0,
                distance: null,
                isFreeShipping: false,
                isCalculating: false,
                error: error.message || 'Gagal menghitung ongkir',
            });
        }
    };

    const total = subtotal + shippingData.fee;

    return (
        <>
            {/* Header */}
            <div className="sticky top-0 z-50 flex items-center bg-white/90 backdrop-blur-md px-4 py-3 shadow-sm justify-between">
                <Link href="/" className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-orange-50 cursor-pointer">
                    <ArrowLeft size={24} />
                </Link>
                <h2 className="text-stone-900 text-lg font-semibold flex-1 text-center pr-10">Keranjang Belanja</h2>
            </div>

            {/* Cart Items Header */}
            <div className="px-4 pb-2 pt-6 flex justify-between items-end">
                <h3 className="text-stone-900 text-lg font-semibold">Daftar Pesanan</h3>
                <span className="text-sm text-orange-600 font-medium">{itemCount} Item</span>
            </div>

            {/* Cart Items */}
            {cartItems.length === 0 ? (
                <div className="mx-4 mt-2 p-8 bg-white rounded-xl border border-orange-50 text-center">
                    <p className="text-gray-500">Keranjang belanja kosong</p>
                    <Link href="/" className="text-orange-500 font-bold mt-2 inline-block">
                        Belanja Sekarang
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-3 mx-4 mt-2">
                    {cartItems.map((item) => (
                        <div key={`${item.id}-${item.variant}`} className="flex flex-col bg-white rounded-xl p-4 shadow-sm border border-orange-50">
                            <div className="flex gap-3">
                                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                    <Image
                                        src={item.image || '/placeholder.png'}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-stone-900 font-semibold text-sm line-clamp-1">{item.name}</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">{item.variant}</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-orange-600 font-bold text-base">Rp {item.price.toLocaleString('id-ID')}</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleQuantityChange(item.id, item.variant, -1)}
                                                className="flex items-center justify-center size-6 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => handleQuantityChange(item.id, item.variant, 1)}
                                                className="flex items-center justify-center size-6 rounded-full bg-orange-500 text-white shadow-sm hover:bg-orange-600 transition-colors"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeItem(item.id, item.variant)}
                                    className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors self-start"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Divider */}
            {cartItems.length > 0 && <div className="mx-4 my-6 h-px bg-gray-200"></div>}

            {/* Delivery Address */}
            {cartItems.length > 0 && (
                <div className="px-4 mb-6">
                    <h3 className="text-stone-900 text-lg font-bold mb-3 flex items-center gap-2">
                        <MapPin size={20} className="text-orange-500" />
                        Alamat Pengiriman
                    </h3>
                    <div className="space-y-3">
                        <div className="relative">
                            <input
                                type="text"
                                value={deliveryAddress}
                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && calculateShipping()}
                                placeholder="Contoh: Jl. Dago No. 123, Bandung"
                                className="w-full p-3 pr-24 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <button
                                onClick={calculateShipping}
                                disabled={shippingData.isCalculating || !deliveryAddress.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                            >
                                {shippingData.isCalculating ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Hitung
                                    </>
                                ) : (
                                    <>
                                        <Navigation size={14} />
                                        Hitung
                                    </>
                                )}
                            </button>
                        </div>

                        {shippingData.error && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs">
                                {shippingData.error}
                            </div>
                        )}

                        {shippingData.distance !== null && !shippingData.error && (
                            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-emerald-700">
                                        📍 Jarak: <strong>{shippingData.distance.toFixed(1)} km</strong>
                                    </span>
                                    {shippingData.isFreeShipping && (
                                        <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                                            GRATIS ONGKIR
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Payment Summary */}
            {cartItems.length > 0 && (
                <div className="px-4 pb-48">
                    <h3 className="text-stone-900 text-lg font-bold mb-4">Rincian Pembayaran</h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Subtotal Produk</span>
                            <span className="font-medium text-stone-900">Rp {subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Biaya Pengiriman</span>
                            {shippingData.isFreeShipping ? (
                                <span className="font-medium text-emerald-600">Gratis</span>
                            ) : shippingData.fee > 0 ? (
                                <span className="font-medium text-stone-900">Rp {shippingData.fee.toLocaleString('id-ID')}</span>
                            ) : (
                                <span className="text-xs text-gray-400">Hitung dulu</span>
                            )}
                        </div>
                        <div className="my-2 border-t border-dashed border-gray-300"></div>
                        <div className="flex justify-between items-center text-base font-semibold">
                            <span className="text-stone-900">Total Pembayaran</span>
                            <span className="text-stone-900">Rp {total.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout Bar */}
            {cartItems.length > 0 && (
                <div className="fixed bottom-[70px] left-0 w-full bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] px-4 py-4 z-40">
                    <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 font-medium">Total Belanja</span>
                            <span className="text-xl font-semibold text-stone-900">Rp {total.toLocaleString('id-ID')}</span>
                        </div>
                        <Link
                            href="/checkout"
                            className={`flex-1 ${shippingData.fee > 0 || shippingData.isFreeShipping ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-300 pointer-events-none'} active:scale-[0.98] transition-all h-12 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-300/30`}
                        >
                            <span className="text-white font-semibold text-base">Lanjut Checkout</span>
                            <ArrowRight className="text-white" size={20} />
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
}
