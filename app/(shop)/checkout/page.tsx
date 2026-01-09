'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Banknote, Building2, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useShopAuth } from '@/contexts/ShopAuthContext';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';
const SHIPPING_FEE = 15000;
const SERVICE_FEE = 1000;

const paymentMethods = [
    { id: 'cod', label: 'COD (Bayar di Tempat)', description: 'Bayar tunai saat kurir sampai', icon: Banknote, color: 'bg-green-100 text-green-600' },
    { id: 'transfer', label: 'Transfer Bank', description: 'BCA, Mandiri, BNI, BRI', icon: Building2, color: 'bg-blue-100 text-blue-600' },
];

interface Address {
    id: string;
    label: string;
    name: string;
    phone: string;
    address: string;
}

export default function CheckoutPage() {
    const router = useRouter();
    const { items, subtotal, clearCart } = useCart();
    const { isAuthenticated, isLoading: authLoading } = useShopAuth();

    const [selectedPayment, setSelectedPayment] = useState('cod');
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [orderNumber, setOrderNumber] = useState('');
    const [error, setError] = useState('');

    // Address state
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [loadingAddresses, setLoadingAddresses] = useState(true);

    // Guest details state
    const [guestInfo, setGuestInfo] = useState({
        name: '',
        phone: '',
        address: '',
    });

    const total = subtotal + (items.length > 0 ? SHIPPING_FEE + SERVICE_FEE : 0);

    // Check auth and load addresses
    useEffect(() => {
        if (isAuthenticated) {
            fetchAddresses();
        } else {
            setLoadingAddresses(false);
        }
    }, [isAuthenticated, authLoading]);

    const fetchAddresses = async () => {
        try {
            const response = await fetch('/api/shop/customers/me/addresses');
            if (response.ok) {
                const data = await response.json();
                setAddresses(data);
                // Select default or first address
                const defaultAddr = data.find((a: Address & { isDefault?: boolean }) => a.isDefault) || data[0];
                if (defaultAddr) setSelectedAddress(defaultAddr);
            }
        } catch (err) {
            console.error('Error fetching addresses:', err);
        } finally {
            setLoadingAddresses(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (items.length === 0) return;

        if (isAuthenticated && !selectedAddress) {
            setError('Pilih alamat pengiriman');
            return;
        }

        if (!isAuthenticated) {
            if (!guestInfo.name || !guestInfo.phone || !guestInfo.address) {
                setError('Lengkapi data pengiriman');
                return;
            }
        }

        setIsProcessing(true);
        setError('');

        try {
            const payload = {
                items: items.map(item => ({
                    productId: item.id,
                    name: item.name,
                    image: item.image,
                    variant: item.variant,
                    quantity: item.quantity,
                    price: item.price,
                })),
                addressLabel: isAuthenticated ? selectedAddress?.label : 'Guest Order',
                addressName: isAuthenticated ? selectedAddress?.name : guestInfo.name,
                addressPhone: isAuthenticated ? selectedAddress?.phone : guestInfo.phone,
                addressFull: isAuthenticated ? selectedAddress?.address : guestInfo.address,
                paymentMethod: selectedPayment,
            };

            const response = await fetch('/api/shop/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Gagal membuat pesanan');
            }

            clearCart();
            setOrderNumber(data.order.orderNumber);
            setOrderPlaced(true);
        } catch (err: any) {
            setError(err.message || 'Gagal membuat pesanan');
        } finally {
            setIsProcessing(false);
        }
    };

    // Loading state
    if (authLoading || loadingAddresses) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-orange-500" size={40} />
            </div>
        );
    }

    // Order success state
    if (orderPlaced) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
                <div className="size-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                    <ShieldCheck size={40} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-stone-900 mb-2">Pesanan Berhasil!</h2>
                <p className="text-gray-600 mb-2">Terima kasih, pesanan Anda sedang diproses.</p>
                <p className="text-sm text-gray-500 mb-6">No. Pesanan: {orderNumber}</p>
                <div className="flex gap-3">
                    <Link
                        href="/orders"
                        className="px-6 py-3 bg-orange-500 text-white font-bold rounded-xl"
                    >
                        Lihat Pesanan
                    </Link>
                    <Link
                        href="/"
                        className="px-6 py-3 border border-orange-500 text-orange-500 font-bold rounded-xl"
                    >
                        Kembali
                    </Link>
                </div>
            </div>
        );
    }

    // Empty cart state
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
                <p className="text-gray-500 mb-4">Keranjang belanja kosong</p>
                <Link
                    href="/"
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
                <Link href="/cart" className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-orange-50">
                    <ArrowLeft size={24} />
                </Link>
                <h2 className="text-stone-900 text-lg font-semibold flex-1 text-center pr-10">Checkout</h2>
            </header>

            <main className="flex flex-col gap-4 p-4 pb-48">
                {/* Shipping Address */}
                <section>
                    <h3 className="text-stone-900 text-lg font-semibold mb-3 px-1">Alamat Pengiriman</h3>

                    {!isAuthenticated ? (
                        <div className="flex flex-col gap-4 bg-white p-5 rounded-2xl shadow-sm border border-orange-100">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 block">Nama Penerima</label>
                                    <input
                                        type="text"
                                        value={guestInfo.name}
                                        onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                                        placeholder="Contoh: Budi Santoso"
                                        className="w-full h-11 bg-stone-50 border border-stone-200 rounded-xl px-4 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 block">Nomor HP / WhatsApp</label>
                                    <input
                                        type="tel"
                                        value={guestInfo.phone}
                                        onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                                        placeholder="Contoh: 08123456789"
                                        className="w-full h-11 bg-stone-50 border border-stone-200 rounded-xl px-4 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 block">Alamat Lengkap</label>
                                    <textarea
                                        value={guestInfo.address}
                                        onChange={(e) => setGuestInfo({ ...guestInfo, address: e.target.value })}
                                        placeholder="Contoh: Jl. Melati No. 12, RT 01/02, Jagakarsa"
                                        rows={3}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors resize-none"
                                    />
                                </div>
                            </div>
                            <div className="mt-2 pt-4 border-t border-stone-100">
                                <p className="text-[11px] text-gray-400 leading-relaxed italic">
                                    * Data ini hanya digunakan untuk keperluan pengiriman pesanan Anda saat ini.
                                </p>
                            </div>
                        </div>
                    ) : addresses.length === 0 ? (
                        <Link
                            href="/addresses"
                            className="flex gap-4 bg-white p-4 rounded-2xl shadow-sm border border-orange-100 items-center"
                        >
                            <div className="flex items-center justify-center rounded-xl bg-orange-100 text-orange-600 shrink-0 size-10">
                                <MapPin size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-orange-600 font-medium">Tambah Alamat</p>
                                <p className="text-gray-500 text-sm">Belum ada alamat pengiriman</p>
                            </div>
                        </Link>
                    ) : (
                        <div className="flex gap-4 bg-white p-4 rounded-2xl shadow-sm border border-orange-100">
                            <div className="flex items-start justify-center rounded-xl bg-orange-100 text-orange-600 shrink-0 size-10 mt-1">
                                <MapPin size={20} className="mt-2.5" />
                            </div>
                            <div className="flex flex-1 flex-col">
                                <div className="flex justify-between items-start">
                                    <p className="text-stone-900 text-base font-bold">{selectedAddress?.label}</p>
                                    <Link href="/addresses" className="text-orange-600 text-sm font-semibold px-2 py-1 rounded hover:bg-orange-50 transition-colors">
                                        Ubah
                                    </Link>
                                </div>
                                <p className="text-gray-500 text-sm mt-1">{selectedAddress?.name}</p>
                                <p className="text-gray-500 text-sm mt-1 leading-relaxed">{selectedAddress?.address}</p>
                                <p className="text-gray-500 text-sm mt-1">{selectedAddress?.phone}</p>
                            </div>
                        </div>
                    )}
                </section>

                {/* Order Summary */}
                <section>
                    <h3 className="text-stone-900 text-lg font-semibold mb-3 px-1">Ringkasan Pesanan</h3>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 flex flex-col gap-1">
                        {items.map((item) => (
                            <div key={`${item.id}-${item.variant}`} className="flex justify-between items-start py-1.5 border-b border-stone-50 last:border-0 hover:bg-stone-50/50 transition-colors">
                                <div className="flex flex-col">
                                    <p className="text-stone-900 text-sm font-semibold flex items-center gap-2">
                                        <span className="size-5 flex items-center justify-center bg-orange-100 text-orange-600 rounded text-[10px] font-black shrink-0">{item.quantity}x</span>
                                        {item.name}
                                    </p>
                                    <p className="text-gray-500 text-[11px] ml-7 italic">{item.variant}</p>
                                </div>
                                <p className="text-stone-900 text-sm font-semibold">
                                    Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                                </p>
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
                                <span className="text-base font-semibold text-stone-900">Total Pembayaran</span>
                                <span className="text-lg font-bold text-orange-600">Rp {total.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-green-100 py-2">
                            <ShieldCheck size={18} className="text-green-700" />
                            <span className="text-xs font-medium text-green-700">Jaminan Produk Segar & Higienis</span>
                        </div>
                    </div>
                </section>

                {/* Error */}
                {error && (
                    <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</p>
                )}
            </main>

            {/* Bottom Bar */}
            <div className="fixed bottom-[70px] left-0 right-0 z-40 w-full bg-white border-t border-gray-100 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="flex gap-4 items-center max-w-md mx-auto">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 font-medium">Total Tagihan</span>
                        <span className="text-xl font-semibold text-stone-900">Rp {total.toLocaleString('id-ID')}</span>
                    </div>
                    <button
                        onClick={handlePlaceOrder}
                        disabled={isProcessing || (isAuthenticated && addresses.length === 0)}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-semibold rounded-xl h-12 flex items-center justify-center gap-2 shadow-lg shadow-orange-200 transition-all disabled:opacity-70"
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
