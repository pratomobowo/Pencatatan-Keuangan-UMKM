'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Banknote, Building2, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';
const SHIPPING_FEE = 15000;
const SERVICE_FEE = 1000;

const deliveryTimes = [
    { id: 'morning', label: 'Besok Pagi', time: '06:00 - 08:00' },
    { id: 'noon', label: 'Besok Siang', time: '10:00 - 12:00' },
    { id: 'afternoon', label: 'Besok Sore', time: '15:00 - 17:00' },
];

const paymentMethods = [
    { id: 'cod', label: 'COD (Bayar di Tempat)', description: 'Bayar tunai saat kurir sampai', icon: Banknote, color: 'bg-green-100 text-green-600' },
    { id: 'transfer', label: 'Transfer Bank', description: 'BCA, Mandiri, BNI, BRI', icon: Building2, color: 'bg-blue-100 text-blue-600' },
];

export default function CheckoutPage() {
    const router = useRouter();
    const { items, subtotal, clearCart } = useCart();
    const [selectedDelivery, setSelectedDelivery] = useState('morning');
    const [selectedPayment, setSelectedPayment] = useState('cod');
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);

    const total = subtotal + (items.length > 0 ? SHIPPING_FEE + SERVICE_FEE : 0);

    const handlePlaceOrder = async () => {
        if (items.length === 0) return;

        setIsProcessing(true);

        // Simulate order processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Here you would normally:
        // 1. Submit order to API
        // 2. Clear cart
        // 3. Navigate to order confirmation

        clearCart();
        setOrderPlaced(true);
        setIsProcessing(false);
    };

    // Order success state
    if (orderPlaced) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
                <div className="size-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                    <ShieldCheck size={40} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 mb-2">Pesanan Berhasil!</h2>
                <p className="text-gray-600 mb-6">Terima kasih, pesanan Anda sedang diproses.</p>
                <Link
                    href="/shop"
                    className="px-6 py-3 bg-orange-500 text-white font-bold rounded-xl"
                >
                    Kembali ke Beranda
                </Link>
            </div>
        );
    }

    // Empty cart state
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
                <p className="text-gray-500 mb-4">Keranjang belanja kosong</p>
                <Link
                    href="/shop"
                    className="px-6 py-3 bg-orange-500 text-white font-bold rounded-xl"
                >
                    Belanja Sekarang
                </Link>
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center bg-white/90 backdrop-blur-md px-4 py-3 shadow-sm justify-between">
                <Link href="/shop/cart" className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-orange-50">
                    <ArrowLeft size={24} />
                </Link>
                <h2 className="text-stone-900 text-lg font-bold flex-1 text-center pr-10">Checkout</h2>
            </header>

            <main className="flex flex-col gap-4 p-4 pb-32">
                {/* Shipping Address */}
                <section>
                    <h3 className="text-stone-900 text-lg font-bold mb-3 px-1">Alamat Pengiriman</h3>
                    <div className="flex gap-4 bg-white p-4 rounded-2xl shadow-sm border border-orange-100">
                        <div className="flex items-start justify-center rounded-xl bg-orange-100 text-orange-600 shrink-0 size-10 mt-1">
                            <MapPin size={20} className="mt-2.5" />
                        </div>
                        <div className="flex flex-1 flex-col">
                            <div className="flex justify-between items-start">
                                <p className="text-stone-900 text-base font-bold">Rumah</p>
                                <button className="text-orange-600 text-sm font-semibold px-2 py-1 rounded hover:bg-orange-50 transition-colors">
                                    Ubah
                                </button>
                            </div>
                            <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                                Jl. Melati No. 12, Jakarta Selatan
                            </p>
                            <p className="text-gray-500 text-sm mt-1">0812-3456-7890</p>
                        </div>
                    </div>
                </section>

                {/* Delivery Time */}
                <section>
                    <h3 className="text-stone-900 text-lg font-bold mb-3 px-1">Waktu Pengiriman</h3>
                    <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
                        {deliveryTimes.map((option) => (
                            <label key={option.id} className="cursor-pointer relative shrink-0">
                                <input
                                    type="radio"
                                    name="delivery_time"
                                    checked={selectedDelivery === option.id}
                                    onChange={() => setSelectedDelivery(option.id)}
                                    className="peer sr-only"
                                />
                                <div className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 px-4 py-3 transition-all ${selectedDelivery === option.id
                                        ? 'border-orange-500 bg-orange-500 text-white'
                                        : 'border-gray-200 bg-white text-gray-500'
                                    }`}>
                                    <span className="text-xs font-semibold uppercase tracking-wider opacity-70">{option.label}</span>
                                    <span className="text-sm font-bold">{option.time}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </section>

                {/* Order Summary */}
                <section>
                    <h3 className="text-stone-900 text-lg font-bold mb-3 px-1">Ringkasan Pesanan</h3>
                    <div className="flex flex-col gap-3">
                        {items.map((item) => (
                            <div key={item.id} className="flex gap-4 bg-white p-3 rounded-2xl shadow-sm border border-orange-100 items-center">
                                <div className="size-16 rounded-lg bg-gray-100 overflow-hidden shrink-0 relative">
                                    <Image
                                        src={item.image || DEFAULT_IMAGE}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex flex-1 flex-col">
                                    <p className="text-stone-900 text-base font-bold leading-tight">{item.name}</p>
                                    <p className="text-gray-500 text-xs">{item.variant}</p>
                                    <div className="flex justify-between items-end mt-1">
                                        <p className="text-stone-900 text-sm font-medium">
                                            Rp {item.price.toLocaleString('id-ID')}
                                        </p>
                                        <p className="text-gray-500 text-sm">x {item.quantity}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Payment Method */}
                <section>
                    <h3 className="text-stone-900 text-lg font-bold mb-3 px-1">Metode Pembayaran</h3>
                    <div className="flex flex-col gap-3">
                        {paymentMethods.map((method) => (
                            <label key={method.id} className="cursor-pointer relative">
                                <input
                                    type="radio"
                                    name="payment_method"
                                    checked={selectedPayment === method.id}
                                    onChange={() => setSelectedPayment(method.id)}
                                    className="peer sr-only"
                                />
                                <div className={`flex items-center gap-4 bg-white p-4 rounded-2xl border-2 transition-all shadow-sm ${selectedPayment === method.id
                                        ? 'border-orange-500 bg-orange-50'
                                        : 'border-transparent'
                                    }`}>
                                    <div className={`flex items-center justify-center rounded-full shrink-0 size-10 ${method.color}`}>
                                        <method.icon size={24} />
                                    </div>
                                    <div className="flex flex-1 flex-col">
                                        <p className="text-stone-900 text-base font-bold">{method.label}</p>
                                        <p className="text-gray-500 text-sm">{method.description}</p>
                                    </div>
                                    <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedPayment === method.id
                                            ? 'border-orange-500 bg-orange-500'
                                            : 'border-gray-300'
                                        }`}>
                                        {selectedPayment === method.id && (
                                            <div className="size-2 rounded-full bg-white"></div>
                                        )}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </section>

                {/* Cost Summary */}
                <section>
                    <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm">
                        <h3 className="text-stone-900 text-base font-bold mb-3">Rincian Biaya</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Total Harga Barang</span>
                                <span className="font-medium text-stone-900">Rp {subtotal.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Ongkos Kirim</span>
                                <span className="font-medium text-stone-900">Rp {SHIPPING_FEE.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Biaya Layanan</span>
                                <span className="font-medium text-stone-900">Rp {SERVICE_FEE.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="my-2 border-t border-dashed border-gray-300"></div>
                            <div className="flex justify-between items-center">
                                <span className="text-base font-bold text-stone-900">Total Pembayaran</span>
                                <span className="text-lg font-bold text-orange-600">Rp {total.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-green-100 py-2">
                            <ShieldCheck size={18} className="text-green-700" />
                            <span className="text-xs font-medium text-green-700">Jaminan Produk Segar & Higienis</span>
                        </div>
                    </div>
                </section>
            </main>

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 w-full bg-white border-t border-gray-100 p-4 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="flex gap-4 items-center max-w-md mx-auto">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 font-medium">Total Tagihan</span>
                        <span className="text-xl font-bold text-stone-900">Rp {total.toLocaleString('id-ID')}</span>
                    </div>
                    <button
                        onClick={handlePlaceOrder}
                        disabled={isProcessing}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold rounded-xl h-12 flex items-center justify-center gap-2 shadow-lg shadow-orange-200 transition-all disabled:opacity-70"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                <span>Memproses...</span>
                            </>
                        ) : (
                            <>
                                <span>Pesan Sekarang</span>
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </>
    );
}
