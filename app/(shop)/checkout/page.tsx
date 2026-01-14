'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, MapPin, Banknote, Building2, ShieldCheck, ArrowRight,
    Loader2, Navigation, CheckCircle2, AlertCircle, HelpCircle, Copy, Check, QrCode, Gift, MessageSquare,
    Package, Store, ChevronDown, Download
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useShopAuth } from '@/contexts/ShopAuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { ShippingMethod } from '@/lib/types';

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
    requiresManualConfirmation: boolean; // New flag for fallback
}

export default function CheckoutPage() {
    const router = useRouter();
    const { items, subtotal, totalSavings, clearCart } = useCart();
    const { isAuthenticated, isLoading: authLoading } = useShopAuth();
    const { addNotification } = useNotifications();

    const [selectedPayment, setSelectedPayment] = useState('cod');
    const [shopPaymentMethods, setShopPaymentMethods] = useState<any[]>([]);
    const [qrisImage, setQrisImage] = useState<string | null>(null);
    const [isShippingDropdownOpen, setIsShippingDropdownOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [orderNumber, setOrderNumber] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState<string | null>(null);

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
        requiresManualConfirmation: false,
    });
    const [availableMethods, setAvailableMethods] = useState<ShippingMethod[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<ShippingMethod | null>(null);

    const [serviceFee, setServiceFee] = useState(0);

    // Voucher state
    const [voucherCode, setVoucherCode] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
    const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);
    const [voucherError, setVoucherError] = useState('');

    // Total calculation: if manual confirmation, shipping is 0 but noted
    const discount = appliedVoucher ? Number(appliedVoucher.value) : 0;
    const total = Math.max(0, subtotal + shippingData.fee + serviceFee - discount);

    // Load initial data
    useEffect(() => {
        fetchShopConfig();
        fetchShippingMethods();
        if (isAuthenticated) {
            fetchAddresses();
        } else {
            setLoadingAddresses(false);
        }
    }, [isAuthenticated, authLoading]);

    useEffect(() => {
        if (selectedMethod) {
            if (isAuthenticated && selectedAddress && selectedMethod.type !== 'PICKUP') {
                calculateShippingForAddress(selectedAddress, selectedMethod.id);
            } else if (selectedMethod.type === 'PICKUP') {
                setShippingData({
                    fee: 0,
                    distance: null,
                    isFreeShipping: false,
                    isCalculating: false,
                    error: null,
                    requiresManualConfirmation: false,
                });
            }
        }
    }, [selectedAddress, isAuthenticated, selectedMethod]);

    const fetchShopConfig = async () => {
        try {
            const res = await fetch('/api/shop/config');
            if (res.ok) {
                const data = await res.json();
                setShopPaymentMethods(data.paymentMethods || []);
                setQrisImage(data.qrisImage || null);
            }
        } catch (err) {
            console.error('Error fetching shop config:', err);
        }
    };

    const fetchShippingMethods = async () => {
        try {
            const res = await fetch('/api/shop/shipping-methods');
            if (res.ok) {
                const data = await res.json();
                setAvailableMethods(data);
                // Set default method
                if (data.length > 0) {
                    const defaultMethod = data.find((m: any) => m.type === 'DISTANCE') || data[0];
                    setSelectedMethod(defaultMethod);
                }
            }
        } catch (err) {
            console.error('Error fetching shipping methods:', err);
        }
    };

    const fetchAddresses = async () => {
        try {
            const response = await fetch('/api/shop/customers/me/addresses');
            if (response.ok) {
                const data = await response.json();
                setAddresses(data);
                const defaultAddr = data.find((a: any) => a.isDefault) || data[0];
                if (defaultAddr) setSelectedAddress(defaultAddr);
            }
        } catch (err) {
            console.error('Error fetching addresses:', err);
        } finally {
            setLoadingAddresses(false);
        }
    };

    const calculateShippingForAddress = async (addr: Address, methodId?: string) => {
        const targetMethodId = methodId || selectedMethod?.id;
        if (!targetMethodId) return;

        if (!addr.latitude || !addr.longitude) {
            // Re-geocode if coordinates missing
            setShippingData(prev => ({ ...prev, isCalculating: true, error: null, requiresManualConfirmation: false }));
            try {
                const geocodeRes = await fetch('/api/shop/geocode', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address: addr.address }),
                });

                if (!geocodeRes.ok) {
                    setShippingData({
                        fee: 0,
                        distance: null,
                        isFreeShipping: false,
                        isCalculating: false,
                        error: null,
                        requiresManualConfirmation: true,
                    });
                    return;
                }
                const { latitude, longitude } = await geocodeRes.json();
                addr.latitude = latitude;
                addr.longitude = longitude;
            } catch (error) {
                setShippingData({
                    fee: 0,
                    distance: null,
                    isFreeShipping: false,
                    isCalculating: false,
                    error: null,
                    requiresManualConfirmation: true,
                });
                return;
            }
        }

        setShippingData(prev => ({ ...prev, isCalculating: true, error: null, requiresManualConfirmation: false }));

        try {
            const res = await fetch('/api/shop/calculate-shipping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    latitude: addr.latitude,
                    longitude: addr.longitude,
                    subtotal,
                    shippingMethodId: targetMethodId
                }),
            });

            if (!res.ok) throw new Error('Gagal menghitung ongkir');
            const result = await res.json();

            if (result.isOutOfRange) {
                setShippingData({
                    fee: 0,
                    distance: result.distance_km,
                    isFreeShipping: false,
                    isCalculating: false,
                    error: result.message || 'Lokasi di luar jangkauan pengiriman',
                    requiresManualConfirmation: false,
                });
                return;
            }

            setShippingData({
                fee: result.shippingFee,
                distance: result.distance_km,
                isFreeShipping: result.isFreeShipping,
                isCalculating: false,
                error: null,
                requiresManualConfirmation: false,
            });

            setServiceFee(result.serviceFee || 0);

        } catch (error: any) {
            setShippingData({
                fee: 0,
                distance: null,
                isFreeShipping: false,
                isCalculating: false,
                error: null,
                requiresManualConfirmation: true,
            });
        }
    };

    const calculateShippingForGuest = async () => {
        if (!guestInfo.address.trim()) {
            setShippingData(prev => ({ ...prev, error: 'Masukkan alamat pengiriman' }));
            return;
        }

        setShippingData(prev => ({ ...prev, isCalculating: true, error: null, requiresManualConfirmation: false }));

        try {
            const geocodeRes = await fetch('/api/shop/geocode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: guestInfo.address }),
            });

            if (!geocodeRes.ok) {
                // Fallback: Allow manual confirmation
                setShippingData({
                    fee: 0,
                    distance: null,
                    isFreeShipping: false,
                    isCalculating: false,
                    error: null,
                    requiresManualConfirmation: true,
                });
                return;
            }

            const { latitude, longitude } = await geocodeRes.json();

            const shippingRes = await fetch('/api/shop/calculate-shipping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    latitude,
                    longitude,
                    subtotal,
                    shippingMethodId: selectedMethod?.id
                }),
            });

            if (!shippingRes.ok) throw new Error('Gagal menghitung ongkir');
            const result = await shippingRes.json();

            if (result.isOutOfRange) {
                setShippingData({
                    fee: 0,
                    distance: result.distance_km,
                    isFreeShipping: false,
                    isCalculating: false,
                    error: result.message || 'Lokasi di luar jangkauan pengiriman',
                    requiresManualConfirmation: false,
                });
                return;
            }

            setShippingData({
                fee: result.shippingFee,
                distance: result.distance_km,
                isFreeShipping: result.isFreeShipping,
                isCalculating: false,
                error: null,
                requiresManualConfirmation: false,
            });

            setServiceFee(result.serviceFee || 0);

        } catch (error: any) {
            // Fallback on error
            setShippingData({
                fee: 0,
                distance: null,
                isFreeShipping: false,
                isCalculating: false,
                error: null,
                requiresManualConfirmation: true,
            });
        }
    };

    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) return;

        setIsValidatingVoucher(true);
        setVoucherError('');
        try {
            const res = await fetch('/api/shop/vouchers/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: voucherCode }),
            });

            const data = await res.json();
            if (res.ok) {
                setAppliedVoucher(data.voucher);
                addNotification('Voucer Berhasil!', 'Potongan diskon telah diterapkan.', 'success');
            } else {
                setVoucherError(data.error || 'Voucer tidak valid');
            }
        } catch (err) {
            setVoucherError('Gagal memvalidasi voucer');
        } finally {
            setIsValidatingVoucher(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (selectedMethod?.type !== 'PICKUP' && shippingData.fee === 0 && !shippingData.isFreeShipping && !shippingData.requiresManualConfirmation) {
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
            if (!guestInfo.name || !guestInfo.phone || (selectedMethod?.type !== 'PICKUP' && !guestInfo.address)) {
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
                    originalPrice: item.originalPrice || item.price,
                    note: item.note || null,
                })),
                addressLabel: isAuthenticated ? selectedAddress?.label : 'Guest Order',
                addressName: isAuthenticated ? selectedAddress?.name : guestInfo.name,
                addressPhone: isAuthenticated ? selectedAddress?.phone : guestInfo.phone,
                addressFull: isAuthenticated ? selectedAddress?.address : guestInfo.address,
                paymentMethod: selectedPayment,
                shippingMethod: selectedMethod?.name || 'Unknown',
                shippingMethodId: selectedMethod?.id || null,
                shippingFee: shippingData.requiresManualConfirmation ? 0 : shippingData.fee, // 0 if manual
                serviceFee: serviceFee,
                voucherCode: appliedVoucher?.code || null,
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

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    }

    const handleDownloadQRIS = () => {
        if (!qrisImage) return;
        const link = document.createElement('a');
        link.href = qrisImage;
        link.download = `QRIS-Pasarantar-${orderNumber}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (authLoading || loadingAddresses) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-orange-500" size={40} />
            </div>
        );
    }

    if (orderPlaced) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="size-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                    <CheckCircle2 size={48} />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 mb-2">Pesanan Berhasil!</h2>
                <p className="text-gray-500 mb-6">
                    Pesan Anda dengan nomor <strong>#{orderNumber}</strong> sedang diproses.
                    {shippingData.requiresManualConfirmation && (
                        <span className="block mt-2 text-orange-600 font-medium bg-orange-50 p-3 rounded-lg text-sm">
                            ⚠️ Ongkir akan dikonfirmasi manual oleh Admin via WhatsApp.
                        </span>
                    )}
                </p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    {selectedPayment === 'qris' && qrisImage && (
                        <div className="mb-4 bg-purple-50 p-4 rounded-2xl border border-purple-100 flex flex-col items-center">
                            <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-3">Scan Untuk Membayar</p>
                            <img
                                src={qrisImage}
                                alt="QRIS Payment"
                                className="w-full max-w-[180px] aspect-square rounded-xl border border-gray-200 shadow-sm bg-white p-2"
                            />
                            <button
                                onClick={handleDownloadQRIS}
                                className="mt-4 flex items-center gap-2 text-xs font-bold text-purple-600 hover:text-purple-700 bg-white px-4 py-2 rounded-full border border-purple-200 shadow-sm active:scale-95 transition-all"
                            >
                                <Download size={14} />
                                Simpan / Download QRIS
                            </button>
                            <p className="text-[10px] text-gray-500 mt-3 text-center italic">Mohon segera selesaikan pembayaran agar pesanan bisa diproses Admin.</p>
                        </div>
                    )}

                    <Link href={`/orders/${orderNumber}`} className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-200 transition-all text-center">
                        Lihat Detail Pesanan
                    </Link>
                    <Link href="/" className="w-full bg-stone-100 text-stone-600 font-bold py-3 rounded-xl hover:bg-stone-200 transition-all">
                        Kembali Belanja
                    </Link>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="size-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-400">
                    <HelpCircle size={40} />
                </div>
                <h2 className="text-xl font-bold text-stone-900 mb-2">Keranjang Kosong</h2>
                <p className="text-gray-500 mb-6">Wah, sepertinya Anda belum memilih produk apa pun.</p>
                <Link href="/" className="bg-orange-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-orange-200">
                    Mulai Belanja
                </Link>
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm">
                <div className="flex items-center px-4 py-3 justify-between">
                    <button onClick={() => router.back()} className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-orange-50">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-stone-900 text-lg font-bold flex-1 text-center pr-10">Checkout</h2>
                </div>
            </header>

            <div className="p-4 pb-24 flex flex-col gap-6 max-w-md mx-auto">
                {/* 1. Alamat Pengiriman Section */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-stone-900 font-bold flex items-center gap-2">
                            <MapPin size={18} className="text-orange-500" />
                            {selectedMethod?.type !== 'PICKUP' ? 'Alamat Pengiriman' : 'Informasi Kontak'}
                        </h3>
                    </div>

                    {isAuthenticated ? (
                        <div className="space-y-3">
                            {addresses.map((addr) => (
                                <div
                                    key={addr.id}
                                    onClick={() => setSelectedAddress(addr)}
                                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedAddress?.id === addr.id ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white hover:border-orange-200'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-100 px-2 py-0.5 rounded">{addr.label}</span>
                                        {selectedAddress?.id === addr.id && <CheckCircle2 size={18} className="text-orange-500" />}
                                    </div>
                                    <p className="font-bold text-sm text-stone-900">{addr.name}</p>
                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{addr.address}</p>
                                    <p className="text-xs text-gray-500 mt-1">{addr.phone}</p>
                                </div>
                            ))}
                            <Link href="/addresses" className="block w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-center text-sm font-medium text-gray-500 hover:bg-gray-50">
                                + Tambah Alamat Baru
                            </Link>

                            {/* Distance display for logged-in users */}
                            {selectedAddress && shippingData.distance !== null && !shippingData.error && (
                                <div className="mt-4 bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-sm text-emerald-800 flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-emerald-700">📍 Jarak: <strong>{shippingData.distance.toFixed(1)} km</strong></span>
                                        {shippingData.isFreeShipping && <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">GRATIS ONGKIR</span>}
                                    </div>
                                </div>
                            )}

                            {selectedAddress && shippingData.error && (
                                <div className="mt-4 bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-start gap-2 text-sm text-rose-700">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <span>{shippingData.error}</span>
                                </div>
                            )}

                            {selectedAddress && shippingData.requiresManualConfirmation && (
                                <div className="mt-4 bg-orange-50 border border-orange-200 p-3 rounded-lg flex items-start gap-2 text-sm text-orange-700">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold">Alamat tidak di temukan</p>
                                        <p className="text-xs mt-1">Biaya ongkir akan di konfirmasi manual oleh admin via WhatsApp setelah pesanan dibuat.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-4 shadow-sm">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Nama Lengkap</label>
                                <input
                                    type="text"
                                    placeholder="Nama penerima"
                                    value={guestInfo.name}
                                    onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Nomor WhatsApp</label>
                                <input
                                    type="tel"
                                    placeholder="Contoh: 0812..."
                                    value={guestInfo.phone}
                                    onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Alamat Lengkap</label>
                                <textarea
                                    placeholder="Jl. Nama Jalan, No. Rumah, Kecamatan, Kota"
                                    rows={3}
                                    value={guestInfo.address}
                                    onChange={(e) => setGuestInfo({ ...guestInfo, address: e.target.value })}
                                    onFocus={(e) => {
                                        setTimeout(() => {
                                            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }, 300);
                                    }}
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-200 transition-all outline-none resize-none"
                                />
                                <p className="text-[10px] text-gray-400">Pastikan alamat lengkap untuk penghitungan ongkir akurat.</p>
                            </div>

                            {selectedMethod?.type !== 'PICKUP' && (
                                <button
                                    onClick={calculateShippingForGuest}
                                    disabled={shippingData.isCalculating || !guestInfo.address || !selectedMethod}
                                    className="w-full py-3 bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50"
                                >
                                    {shippingData.isCalculating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                                    {shippingData.isCalculating ? 'Menghitung...' : 'Hitung Ongkir'}
                                </button>
                            )}

                            {shippingData.distance !== null && !shippingData.error && (
                                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-sm text-emerald-800 flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-emerald-700">📍 Jarak: <strong>{shippingData.distance.toFixed(1)} km</strong></span>
                                        {shippingData.isFreeShipping && <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">GRATIS ONGKIR</span>}
                                    </div>
                                </div>
                            )}

                            {shippingData.error && (
                                <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-start gap-2 text-sm text-rose-700">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <span>{shippingData.error}</span>
                                </div>
                            )}

                            {shippingData.requiresManualConfirmation && (
                                <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg flex items-start gap-2 text-sm text-orange-700">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold">Alamat tidak di temukan</p>
                                        <p className="text-xs mt-1">Biaya ongkir akan di konfirmasi manual oleh admin via WhatsApp setelah pesanan dibuat.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>


                {/* 2. Pesanan Anda (Product Summary) Section */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-stone-900 font-bold flex items-center gap-2">
                            <ShieldCheck size={18} className="text-orange-500" />
                            Pesanan Anda
                        </h3>
                        <Link href="/cart" className="text-xs font-bold text-orange-600 hover:underline">
                            Ubah Keranjang
                        </Link>
                    </div>
                    <div className="flex flex-col gap-3">
                        {items.map((item) => (
                            <div key={`${item.id}-${item.variant}`} className="flex flex-col bg-stone-50/50 rounded-xl p-3 border border-gray-100">
                                <div className="flex gap-3">
                                    <div className="relative size-16 rounded-lg overflow-hidden bg-white shrink-0 border border-gray-100">
                                        <Image
                                            src={item.image || DEFAULT_IMAGE}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className="text-stone-900 font-bold text-sm truncate">{item.name}</h4>
                                            <span className="text-xs font-bold text-stone-400 shrink-0">x{item.quantity}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <p className="text-orange-600 font-bold text-sm">
                                                Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                                                <span className="text-[10px] font-medium opacity-60 ml-0.5">/{item.variant}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {item.note && (
                                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-start gap-2">
                                        <MessageSquare size={12} className="text-stone-400 shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-stone-600 italic leading-tight px-1">"{item.note}"</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Metode Pengiriman Dropdown */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-stone-900 font-bold mb-3 flex items-center gap-2">
                        <Package size={18} className="text-orange-500" />
                        Pilih Metode Pengiriman
                    </h3>
                    <div className="relative">
                        <div
                            onClick={() => setIsShippingDropdownOpen(!isShippingDropdownOpen)}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-transparent hover:border-orange-200 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="size-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                    {selectedMethod?.type === 'PICKUP' ? <Store size={20} /> : <Navigation size={20} />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-stone-900">
                                        {selectedMethod?.name || 'Pilih Pengiriman'}
                                    </p>
                                    <p className="text-[10px] text-gray-500 uppercase font-medium tracking-wider">
                                        {selectedMethod?.type === 'PICKUP' ? 'Ambil di Toko' : 'Kirim ke alamat Anda'}
                                    </p>
                                </div>
                            </div>
                            <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 ${isShippingDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>

                        {/* Dropdown Menu */}
                        {isShippingDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 shadow-xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                {availableMethods.map((method, idx) => (
                                    <React.Fragment key={method.id}>
                                        <div
                                            onClick={() => {
                                                setSelectedMethod(method);
                                                if (method.type === 'PICKUP') {
                                                    setShippingData(prev => ({ ...prev, error: null, fee: 0, distance: null }));
                                                }
                                                setIsShippingDropdownOpen(false);
                                            }}
                                            className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-orange-50 transition-colors ${selectedMethod?.id === method.id ? 'bg-orange-50/50' : ''}`}
                                        >
                                            <div className={`size-10 rounded-full flex items-center justify-center ${selectedMethod?.id === method.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                {method.type === 'PICKUP' ? <Store size={20} /> : <Navigation size={20} />}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-sm font-bold ${selectedMethod?.id === method.id ? 'text-orange-600' : 'text-stone-900'}`}>{method.name}</p>
                                                <p className="text-[10px] text-gray-500">{method.description || (method.type === 'PICKUP' ? 'Tidak ada biaya ongkir' : 'Estimasi lebih cepat')}</p>
                                            </div>
                                            {selectedMethod?.id === method.id && <CheckCircle2 size={18} className="text-orange-500" />}
                                        </div>
                                        {idx < availableMethods.length - 1 && <div className="h-px bg-gray-100 mx-4" />}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                    </div>
                    {selectedMethod?.type === 'PICKUP' && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg text-xs text-blue-700 flex items-start gap-2 border border-blue-100">
                            <HelpCircle size={14} className="shrink-0 mt-0.5" />
                            <p>Silakan ambil pesanan Anda langsung di toko atau gunakan driver pilihan Anda. Alamat toko tersedia di halaman Detail Toko.</p>
                        </div>
                    )}
                </div>

                {/* Payment Method */}
                <div>
                    <h3 className="text-stone-900 font-bold mb-3">Metode Pembayaran</h3>
                    <div className="space-y-2">
                        {/* COD Option */}
                        <div
                            onClick={() => setSelectedPayment('cod')}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPayment === 'cod' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-orange-300'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-100 text-green-600"><Banknote size={20} /></div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm text-stone-900">COD (Bayar di Tempat)</p>
                                    <p className="text-xs text-gray-500">Bayar tunai saat kurir sampai</p>
                                </div>
                                {selectedPayment === 'cod' && <CheckCircle2 size={20} className="text-orange-500" />}
                            </div>
                        </div>

                        {/* QRIS Option */}
                        {qrisImage && (
                            <div
                                onClick={() => setSelectedPayment('qris')}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPayment === 'qris' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-orange-300'}`}
                            >
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-purple-100 text-purple-600"><QrCode size={20} /></div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-sm text-stone-900">QRIS</p>
                                            <p className="text-xs text-gray-500">Scan QR untuk bayar</p>
                                        </div>
                                        {selectedPayment === 'qris' && <CheckCircle2 size={20} className="text-orange-500" />}
                                    </div>

                                    {selectedPayment === 'qris' && (
                                        <div className="mt-2 text-xs text-orange-600 bg-orange-100/50 px-3 py-2 rounded-lg border border-orange-200">
                                            Lanjutkan checkout untuk melihat kode QRIS pembayaran.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Bank Transfer Options */}
                        {shopPaymentMethods.map((method, idx) => {
                            const methodId = `transfer-${idx}`;
                            return (
                                <div
                                    key={methodId}
                                    onClick={() => setSelectedPayment(methodId)}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPayment === methodId ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-orange-300'}`}
                                >
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600"><Building2 size={20} /></div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm text-stone-900">Transfer {method.name}</p>
                                                <p className="text-xs text-gray-500">Bayar via transfer bank</p>
                                            </div>
                                            {selectedPayment === methodId && <CheckCircle2 size={20} className="text-orange-500" />}
                                        </div>

                                        {selectedPayment === methodId && (
                                            <div className="mt-2 p-3 bg-white rounded-lg border border-orange-200 border-dashed animate-in fade-in slide-in-from-top-1 duration-200">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nomor Rekening</p>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCopy(method.details.split('\n')[0], methodId);
                                                        }}
                                                        className="text-orange-500 flex items-center gap-1 text-[10px] font-bold"
                                                    >
                                                        {copied === methodId ? <Check size={12} /> : <Copy size={12} />}
                                                        {copied === methodId ? 'Tersalin' : 'Salin'}
                                                    </button>
                                                </div>
                                                <p className="text-sm font-mono font-bold text-stone-800 break-all">{method.details}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Voucher Section */}
                {isAuthenticated && (
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="text-stone-900 font-bold mb-3 flex items-center gap-2">
                            <Gift size={18} className="text-orange-500" />
                            Gunakan Voucer
                        </h3>
                        {appliedVoucher ? (
                            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-emerald-600 tracking-wider">VOUCER TERAPLIKASI</p>
                                    <p className="text-sm font-bold text-emerald-800">{appliedVoucher.code}</p>
                                    <p className="text-[10px] text-emerald-700">Potongan Rp {Number(appliedVoucher.value).toLocaleString('id-ID')}</p>
                                </div>
                                <button
                                    onClick={() => { setAppliedVoucher(null); setVoucherCode(''); }}
                                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
                                >
                                    Batal
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Ketik kode voucer..."
                                        value={voucherCode}
                                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                        className="flex-1 px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-200 outline-none uppercase font-mono"
                                    />
                                    <button
                                        onClick={handleApplyVoucher}
                                        disabled={isValidatingVoucher || !voucherCode}
                                        className="px-4 py-3 bg-orange-500 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                                    >
                                        {isValidatingVoucher ? <Loader2 size={16} className="animate-spin" /> : 'Pakai'}
                                    </button>
                                </div>
                                {voucherError && <p className="text-xs text-rose-500 px-1 font-medium">{voucherError}</p>}
                                <p className="text-[10px] text-gray-400">Punya poin? Tukarkan di menu Akun &gt; Loyalty</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Payment Summary */}
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <h3 className="text-stone-900 font-bold mb-3">Rincian Pembayaran</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal Produk</span>
                            <span className="font-medium">Rp {(subtotal + totalSavings).toLocaleString('id-ID')}</span>
                        </div>
                        {totalSavings > 0 && (
                            <div className="flex justify-between">
                                <span className="text-emerald-600 font-medium italic">Hemat Promo</span>
                                <span className="font-medium text-emerald-600">- Rp {totalSavings.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-gray-600">Biaya Pengiriman</span>
                            {shippingData.requiresManualConfirmation ? (
                                <span className="font-medium text-orange-600">Konfirmasi Admin</span>
                            ) : shippingData.isFreeShipping ? (
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
                        {discount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-emerald-600 font-medium italic">Voucer Loyalitas</span>
                                <span className="font-medium text-emerald-600">- Rp {discount.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        <div className="border-t border-dashed border-gray-300 my-2"></div>
                        <div className="flex justify-between text-lg font-black pt-2 border-t border-gray-100">
                            <span className="text-stone-900">Total Tagihan</span>
                            {shippingData.requiresManualConfirmation ? (
                                <div className="text-right">
                                    <span className="text-orange-600 block font-black text-xl">Rp {total.toLocaleString('id-ID')}</span>
                                    <span className="text-[10px] text-gray-500 font-normal italic">+ Ongkir dihitung manual</span>
                                </div>
                            ) : (
                                <span className="text-orange-600 text-xl font-black">Rp {total.toLocaleString('id-ID')}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Trust Badge */}
                <div className="flex items-center justify-center gap-2 text-gray-400 py-2">
                    <ShieldCheck size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Transaksi Aman & Terenkripsi</span>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-sm text-rose-700 flex items-start gap-2">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {/* Checkout Button */}
            <div className="fixed bottom-[72px] left-0 w-full bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] px-4 py-4 z-40">
                <button
                    onClick={handlePlaceOrder}
                    disabled={
                        isProcessing ||
                        (selectedMethod?.type !== 'PICKUP' && shippingData.fee === 0 && !shippingData.isFreeShipping && !shippingData.requiresManualConfirmation) ||
                        !!shippingData.error
                    }
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
