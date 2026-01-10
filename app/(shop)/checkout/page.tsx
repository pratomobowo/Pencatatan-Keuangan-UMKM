'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, MapPin, Banknote, Building2, ShieldCheck, ArrowRight,
    Loader2, Navigation, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useShopAuth } from '@/contexts/ShopAuthContext';
import { useNotifications } from '@/contexts/NotificationContext';

const DEFAULT_IMAGE = '/images/coming-soon.jpg';

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
    latitude?: number;
    longitude?: number;
}

interface ShippingData {
    fee: number;
    distance: number | null;
    isFreeShipping: boolean;
    isCalculating: boolean;
    error: string | null;
}

export default function CheckoutPage() {
    const router = useRouter();
    const { items, subtotal, clearCart } = useCart();
    const { isAuthenticated, isLoading: authLoading } = useShopAuth();
    const { addNotification } = useNotifications();

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

    // Shipping state
    const [shippingData, setShippingData] = useState<ShippingData>({
        fee: 0,
        distance: null,
        isFreeShipping: false,
        isCalculating: false,
        error: null,
    });

    const [serviceFee, setServiceFee] = useState(0);
    const total = subtotal + shippingData.fee + serviceFee;

    // Load addresses for authenticated users
    useEffect(() => {
        if (isAuthenticated) {
            fetchAddresses();
        } else {
            setLoadingAddresses(false);
        }
    }, [isAuthenticated, authLoading]);

    // Auto-calculate shipping when address is selected (for logged-in users)
    useEffect(() => {
        if (isAuthenticated && selectedAddress) {
            calculateShippingForAddress(selectedAddress);
        }
    }, [selectedAddress, isAuthenticated]);

    const fetchAddresses = async () => {
        try {
            const response = await fetch('/api/shop/customers/me/addresses');
            if (response.ok) {
                const data = await response.json();
                setAddresses(data);
                const defaultAddr = data.find((a: Address & { isDefault?: boolean }) => a.isDefault) || data[0];
                if (defaultAddr) setSelectedAddress(defaultAddr);
            }
        } catch (err) {
            console.error('Error fetching addresses:', err);
        } finally {
            setLoadingAddresses(false);
        }
    };

    const calculateShippingForAddress = async (address: Address) => {
        setShippingData(prev => ({ ...prev, isCalculating: true, error: null }));

        try {
            let latitude = address.latitude;
            let longitude = address.longitude;

            // If no coordinates saved, geocode the address
            if (!latitude || !longitude) {
                const geocodeRes = await fetch('/api/shop/geocode', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address: address.address }),
                });

                if (!geocodeRes.ok) {
                    throw new Error('Gagal menemukan lokasi alamat');
                }

                const geocodeData = await geocodeRes.json();
                latitude = geocodeData.latitude;
                longitude = geocodeData.longitude;
            }

            // Calculate shipping
            const shippingRes = await fetch('/api/shop/calculate-shipping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude, longitude, subtotal }),
            });

            if (!shippingRes.ok) {
                throw new Error('Gagal menghitung ongkir');
            }

            const result = await shippingRes.json();

            if (result.isOutOfRange) {
                setShippingData({
                    fee: 0,
                    distance: result.distance_km,
                    isFreeShipping: false,
                    isCalculating: false,
                    error: result.message || 'Lokasi di luar jangkauan pengiriman',
                });
                return;
            }

            setShippingData({
                fee: result.shippingFee,
                distance: result.distance_km,
                isFreeShipping: result.isFreeShipping,
                isCalculating: false,
                error: null,
            });

            setServiceFee(result.serviceFee || 0);
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

    const calculateShippingForGuest = async () => {
        if (!guestInfo.address.trim()) {
            setShippingData(prev => ({ ...prev, error: 'Masukkan alamat pengiriman' }));
            return;
        }

        setShippingData(prev => ({ ...prev, isCalculating: true, error: null }));

        try {
            // Geocode address
            const geocodeRes = await fetch('/api/shop/geocode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: guestInfo.address }),
            });

            if (!geocodeRes.ok) {
                const error = await geocodeRes.json();
                throw new Error(error.message || 'Alamat tidak ditemukan');
            }

            const { latitude, longitude } = await geocodeRes.json();

            // Calculate shipping
            const shippingRes = await fetch('/api/shop/calculate-shipping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude, longitude, subtotal }),
            });

            if (!shippingRes.ok) {
                throw new Error('Gagal menghitung ongkir');
            }

            const result = await shippingRes.json();

            if (result.isOutOfRange) {
                setShippingData({
                    fee: 0,
                    distance: result.distance_km,
                    isFreeShipping: false,
                    isCalculating: false,
                    error: result.message || 'Lokasi di luar jangkauan pengiriman',
                });
                return;
            }

            setShippingData({
                fee: result.shippingFee,
                distance: result.distance_km,
                isFreeShipping: result.isFreeShipping,
                isCalculating: false,
                error: null,
            });

            setServiceFee(result.serviceFee || 0);
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

    const handlePlaceOrder = async () => {
        if (items.length === 0) return;

        // Validate shipping calculated
        if (shippingData.fee === 0 && !shippingData.isFreeShipping) {
            setError('Hitung ongkir terlebih dahulu');
            return;
        }

        if (shippingData.error) {
            setError('Tidak bisa checkout: ' + shippingData.error);
            return;
        }

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
                shippingFee: shippingData.fee,
                serviceFee: serviceFee,
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

            addNotification(
                'Pesanan Berhasil',
                `Pesanan #${data.order.orderNumber} telah berhasil dibuat!`,
                'success'
            );
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

            <div className="px-4 py-6 pb-48 space-y-6">
                {/* Order Items Summary */}
                <div>
                    <h3 className="text-stone-900 font-bold mb-3">Pesanan Anda ({items.length} item)</h3>
                    <div className="space-y-2">
                        {items.map((item) => (
                            <div key={`${item.id}-${item.variant}`} className="flex gap-3 bg-white p-3 rounded-lg border border-gray-100">
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                    <Image
                                        src={item.image || DEFAULT_IMAGE}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-stone-900 line-clamp-1">{item.name}</h4>
                                    <p className="text-xs text-gray-500">{item.variant}</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs text-gray-600">{item.quantity}x</span>
                                        <span className="text-sm font-bold text-orange-600">Rp {item.price.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Delivery Address */}
                <div>
                    <h3 className="text-stone-900 font-bold mb-3 flex items-center gap-2">
                        <MapPin size={20} className="text-orange-500" />
                        Alamat Pengiriman
                    </h3>

                    {isAuthenticated ? (
                        // Logged-in user: Select from saved addresses
                        <div className="space-y-3">
                            {addresses.length > 0 ? (
                                addresses.map((addr) => (
                                    <div
                                        key={addr.id}
                                        onClick={() => setSelectedAddress(addr)}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddress?.id === addr.id
                                                ? 'border-orange-500 bg-orange-50'
                                                : 'border-gray-200 bg-white hover:border-orange-300'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                                                        {addr.label}
                                                    </span>
                                                    {selectedAddress?.id === addr.id && (
                                                        <CheckCircle2 size={16} className="text-orange-500" />
                                                    )}
                                                </div>
                                                <p className="font-semibold text-sm text-stone-900">{addr.name}</p>
                                                <p className="text-xs text-gray-600">{addr.phone}</p>
                                                <p className="text-xs text-gray-500 mt-1">{addr.address}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-sm text-yellow-800">
                                    Belum ada alamat tersimpan. <Link href="/addresses" className="font-bold underline">Tambah alamat</Link>
                                </div>
                            )}

                            {shippingData.isCalculating && (
                                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center gap-2 text-sm text-blue-700">
                                    <Loader2 size={16} className="animate-spin" />
                                    Menghitung ongkir...
                                </div>
                            )}

                            {shippingData.distance !== null && !shippingData.error && (
                                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-emerald-700">
                                            📍 Jarak: <strong>{shippingData.distance.toFixed(1)} km</strong>
                                        </span>
                                        {shippingData.isFreeShipping && (
                                            <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                                GRATIS ONGKIR
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {shippingData.error && (
                                <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-start gap-2 text-sm text-rose-700">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <span>{shippingData.error}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Guest: Manual input
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Nama Lengkap"
                                value={guestInfo.name}
                                onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <input
                                type="tel"
                                placeholder="Nomor Telepon"
                                value={guestInfo.phone}
                                onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <div className="relative">
                                <textarea
                                    placeholder="Alamat Lengkap (Jl. Nama Jalan, Kota)"
                                    value={guestInfo.address}
                                    onChange={(e) => setGuestInfo({ ...guestInfo, address: e.target.value })}
                                    rows={3}
                                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                            <button
                                onClick={calculateShippingForGuest}
                                disabled={shippingData.isCalculating || !guestInfo.address.trim()}
                                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {shippingData.isCalculating ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Menghitung Ongkir...
                                    </>
                                ) : (
                                    <>
                                        <Navigation size={18} />
                                        Hitung Ongkir
                                    </>
                                )}
                            </button>

                            {shippingData.distance !== null && !shippingData.error && (
                                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-emerald-700">
                                            📍 Jarak: <strong>{shippingData.distance.toFixed(1)} km</strong>
                                        </span>
                                        {shippingData.isFreeShipping && (
                                            <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                                GRATIS ONGKIR
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {shippingData.error && (
                                <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-start gap-2 text-sm text-rose-700">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <span>{shippingData.error}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Payment Method */}
                <div>
                    <h3 className="text-stone-900 font-bold mb-3">Metode Pembayaran</h3>
                    <div className="space-y-2">
                        {paymentMethods.map((method) => (
                            <div
                                key={method.id}
                                onClick={() => setSelectedPayment(method.id)}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPayment === method.id
                                        ? 'border-orange-500 bg-orange-50'
                                        : 'border-gray-200 bg-white hover:border-orange-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${method.color}`}>
                                        <method.icon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm text-stone-900">{method.label}</p>
                                        <p className="text-xs text-gray-500">{method.description}</p>
                                    </div>
                                    {selectedPayment === method.id && (
                                        <CheckCircle2 size={20} className="text-orange-500" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <h3 className="text-stone-900 font-bold mb-3">Rincian Pembayaran</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal Produk</span>
                            <span className="font-medium">Rp {subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Biaya Pengiriman</span>
                            {shippingData.isFreeShipping ? (
                                <span className="font-medium text-emerald-600">Gratis</span>
                            ) : shippingData.fee > 0 ? (
                                <span className="font-medium">Rp {shippingData.fee.toLocaleString('id-ID')}</span>
                            ) : (
                                <span className="text-xs text-gray-400">Belum dihitung</span>
                            )}
                        </div>
                        {serviceFee > 0 && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Biaya Layanan</span>
                                <span className="font-medium">Rp {serviceFee.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        <div className="border-t border-dashed border-gray-300 my-2"></div>
                        <div className="flex justify-between text-base font-bold">
                            <span>Total Pembayaran</span>
                            <span className="text-orange-600">Rp {total.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-sm text-rose-700 flex items-start gap-2">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {/* Checkout Button */}
            <div className="fixed bottom-[70px] left-0 w-full bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] px-4 py-4 z-40">
                <button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing || (shippingData.fee === 0 && !shippingData.isFreeShipping) || !!shippingData.error}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Memproses...
                        </>
                    ) : (
                        <>
                            <span>Buat Pesanan</span>
                            <ArrowRight size={20} />
                        </>
                    )}
                </button>
            </div>
        </>
    );
}
