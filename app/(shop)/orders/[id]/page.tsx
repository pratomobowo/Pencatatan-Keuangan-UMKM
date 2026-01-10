'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, Phone, Copy, Check, Loader2, Building2 } from 'lucide-react';
import { useShopAuth } from '@/contexts/ShopAuthContext';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';

interface OrderDetail {
    id: string;
    orderNumber: string;
    date: string;
    status: OrderStatus;
    items: { name: string; quantity: number; price: number; image: string }[];
    subtotal: number;
    shippingFee: number;
    serviceFee?: number;
    grandTotal: number;

    // Unified Address Fields
    recipientName: string;
    recipientPhone: string;
    shippingAddress: string;

    deliveryTime?: string;
    paymentMethod: string;
}

const statusSteps: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
    { status: 'confirmed', label: 'Pesanan Dikonfirmasi', icon: CheckCircle },
    { status: 'preparing', label: 'Sedang Disiapkan', icon: Package },
    { status: 'shipping', label: 'Dalam Pengiriman', icon: Truck },
    { status: 'delivered', label: 'Terkirim', icon: CheckCircle },
];

const getStatusIndex = (status: OrderStatus) => {
    if (status === 'pending') return -1;
    if (status === 'cancelled') return -2;
    const index = statusSteps.findIndex(s => s.status === status);
    return index >= 0 ? index : 0;
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useShopAuth();

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [shopConfig, setShopConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }

        if (isAuthenticated) {
            fetchOrder();
        }
    }, [isAuthenticated, authLoading, id]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const [orderRes, configRes] = await Promise.all([
                fetch(`/api/shop/orders/${id}`),
                fetch('/api/shop/config')
            ]);

            if (!orderRes.ok) {
                if (orderRes.status === 404) {
                    setError('Pesanan tidak ditemukan');
                } else {
                    throw new Error('Failed to fetch order');
                }
                return;
            }

            const orderData = await orderRes.json();
            setOrder(orderData);

            if (configRes.ok) {
                const configData = await configRes.json();
                setShopConfig(configData);
            }
        } catch (err) {
            console.error('Error fetching order/config:', err);
            setError('Gagal memuat pesanan');
        } finally {
            setLoading(false);
        }
    };

    const copyOrderNumber = () => {
        if (order) {
            navigator.clipboard.writeText(order.orderNumber);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-orange-500" size={40} />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <p className="text-red-500 mb-4">{error || 'Pesanan tidak ditemukan'}</p>
                <Link href="/orders" className="text-orange-500 font-bold">
                    Kembali ke Pesanan
                </Link>
            </div>
        );
    }

    const currentStep = getStatusIndex(order.status);

    return (
        <>
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm">
                <div className="flex items-center px-4 py-3 justify-between">
                    <Link href="/orders" className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-orange-50">
                        <ArrowLeft size={24} />
                    </Link>
                    <h2 className="text-stone-900 text-lg font-bold flex-1 text-center pr-10">Detail Pesanan</h2>
                </div>
            </header>

            <main className="p-4 pb-24 flex flex-col gap-4">
                {/* Order Number */}
                <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Nomor Pesanan</p>
                            <p className="text-lg font-bold text-stone-900">{order.orderNumber}</p>
                        </div>
                        <button
                            onClick={copyOrderNumber}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 text-orange-600 text-sm font-medium hover:bg-orange-100 transition-colors"
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? 'Tersalin!' : 'Salin'}
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{order.date}</p>
                </div>

                {/* Order Tracking */}
                {order.status !== 'cancelled' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4">
                        <h3 className="text-base font-bold text-stone-900 mb-4">Status Pesanan</h3>
                        <div className="flex flex-col gap-4">
                            {statusSteps.map((step, index) => {
                                const isCompleted = index <= currentStep;
                                const isCurrent = index === currentStep;
                                const StepIcon = step.icon;

                                return (
                                    <div key={step.status} className="flex items-center gap-4">
                                        <div className={`relative flex items-center justify-center size-10 rounded-full shrink-0 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                            }`}>
                                            <StepIcon size={20} className={isCompleted ? 'text-white' : 'text-gray-400'} />
                                            {index < statusSteps.length - 1 && (
                                                <div className={`absolute top-10 left-1/2 w-0.5 h-6 -translate-x-1/2 ${isCompleted && index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                                                    }`}></div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`font-medium ${isCompleted ? 'text-stone-900' : 'text-gray-400'}`}>
                                                {step.label}
                                            </p>
                                            {isCurrent && (
                                                <p className="text-sm text-green-600 font-medium mt-0.5">Saat ini</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Cancelled Status */}
                {order.status === 'cancelled' && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                        <p className="text-red-600 font-bold">Pesanan Dibatalkan</p>
                    </div>
                )}

                {/* Delivery Address */}
                <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4">
                    <h3 className="text-base font-bold text-stone-900 mb-3">Alamat Pengiriman</h3>
                    <div className="flex gap-3">
                        <MapPin size={20} className="text-orange-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-stone-900">{order.recipientName}</p>
                            <p className="text-sm text-gray-600 mt-1">{order.shippingAddress}</p>
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                <Phone size={14} /> {order.recipientPhone}
                            </p>
                        </div>
                    </div>
                    {order.deliveryTime && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-sm text-gray-500">Waktu Pengiriman</p>
                            <p className="font-medium text-stone-900">{order.deliveryTime}</p>
                        </div>
                    )}
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4">
                    <h3 className="text-base font-bold text-stone-900 mb-3">Produk Dipesan</h3>
                    <div className="flex flex-col gap-3">
                        {order.items.map((item, index) => (
                            <div key={index} className="flex gap-3 items-center">
                                <div className="size-16 rounded-lg bg-gray-100 overflow-hidden relative shrink-0">
                                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-stone-900">{item.name}</p>
                                    <p className="text-sm text-gray-500">x{item.quantity}</p>
                                </div>
                                <p className="font-medium text-stone-900">
                                    Rp {((item.price || 0) * (item.quantity || 0)).toLocaleString('id-ID')}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4">
                    <h3 className="text-base font-bold text-stone-900 mb-3">Rincian Pembayaran</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="text-stone-900">Rp {(order.subtotal || 0).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Ongkos Kirim</span>
                            <span className="text-stone-900">Rp {(order.shippingFee || 0).toLocaleString('id-ID')}</span>
                        </div>
                        {order.serviceFee && order.serviceFee > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Biaya Layanan</span>
                                <span className="text-stone-900">Rp {order.serviceFee.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        <div className="border-t border-dashed border-gray-200 my-2"></div>
                        <div className="flex justify-between">
                            <span className="font-bold text-stone-900">Total</span>
                            <span className="font-bold text-orange-600">Rp {(order.grandTotal || 0).toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-500">Metode Pembayaran</p>
                        <p className="font-medium text-stone-900 uppercase">
                            {order.paymentMethod === 'cod' ? 'Bayar di Tempat (COD)' : order.paymentMethod.replace('transfer-', 'Transfer ')}
                        </p>
                    </div>
                </div>

                {/* Payment Instructions for Transfer */}
                {order.status === 'pending' && order.paymentMethod.startsWith('transfer-') && (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 shadow-sm">
                        <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                            <Building2 size={16} /> Instruksi Pembayaran
                        </h3>
                        <p className="text-xs text-blue-600 mb-4">
                            Silakan lakukan transfer sesuai rincian di bawah ini dan simpan bukti transfer Anda.
                        </p>

                        {(() => {
                            const idx = parseInt(order.paymentMethod.split('-')[1]);
                            const method = shopConfig?.paymentMethods?.[idx];
                            if (!method) return null;

                            return (
                                <div className="bg-white rounded-xl p-3 border border-blue-200 border-dashed">
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">
                                        Transfer ke {method.name}
                                    </p>
                                    <p className="text-sm font-mono font-bold text-stone-800 break-all mb-2 whitespace-pre-line">
                                        {method.details}
                                    </p>
                                    <div className="flex justify-between items-center pt-2 border-t border-blue-50">
                                        <p className="text-xs text-gray-400">Total Tagihan:</p>
                                        <p className="text-sm font-bold text-blue-700">Rp {order.grandTotal.toLocaleString('id-ID')}</p>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Action Button */}
                {order.status === 'shipping' && (
                    <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-all">
                        Hubungi Kurir
                    </button>
                )}
            </main>
        </>
    );
}
