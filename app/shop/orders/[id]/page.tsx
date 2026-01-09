'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, Phone, Copy, Check } from 'lucide-react';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';

interface OrderDetail {
    id: string;
    orderNumber: string;
    date: string;
    status: OrderStatus;
    items: { name: string; quantity: number; price: number; image: string }[];
    subtotal: number;
    shippingFee: number;
    total: number;
    address: {
        name: string;
        phone: string;
        address: string;
    };
    deliveryTime: string;
    paymentMethod: string;
}

// Mock order - replace with API
const mockOrder: OrderDetail = {
    id: '1',
    orderNumber: 'ORD-2024-001',
    date: '8 Jan 2024, 14:30',
    status: 'shipping',
    items: [
        { name: 'Salmon Fillet Segar', quantity: 1, price: 85000, image: 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=200&q=80' },
        { name: 'Udang Vaname Segar', quantity: 2, price: 44000, image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=200&q=80' },
    ],
    subtotal: 173000,
    shippingFee: 15000,
    total: 188000,
    address: {
        name: 'Rumah',
        phone: '0812-3456-7890',
        address: 'Jl. Melati No. 12, Jakarta Selatan',
    },
    deliveryTime: 'Besok, 06:00 - 08:00',
    paymentMethod: 'COD (Bayar di Tempat)',
};

const statusSteps: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
    { status: 'confirmed', label: 'Pesanan Dikonfirmasi', icon: CheckCircle },
    { status: 'preparing', label: 'Sedang Disiapkan', icon: Package },
    { status: 'shipping', label: 'Dalam Pengiriman', icon: Truck },
    { status: 'delivered', label: 'Terkirim', icon: CheckCircle },
];

const getStatusIndex = (status: OrderStatus) => {
    const index = statusSteps.findIndex(s => s.status === status);
    return index >= 0 ? index : 0;
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [order] = useState<OrderDetail>(mockOrder);
    const [copied, setCopied] = useState(false);

    const currentStep = getStatusIndex(order.status);

    const copyOrderNumber = () => {
        navigator.clipboard.writeText(order.orderNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm">
                <div className="flex items-center px-4 py-3 justify-between">
                    <Link href="/shop/orders" className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-orange-50">
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

                {/* Delivery Address */}
                <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4">
                    <h3 className="text-base font-bold text-stone-900 mb-3">Alamat Pengiriman</h3>
                    <div className="flex gap-3">
                        <MapPin size={20} className="text-orange-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-stone-900">{order.address.name}</p>
                            <p className="text-sm text-gray-600 mt-1">{order.address.address}</p>
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                <Phone size={14} /> {order.address.phone}
                            </p>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-500">Waktu Pengiriman</p>
                        <p className="font-medium text-stone-900">{order.deliveryTime}</p>
                    </div>
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
                                    Rp {(item.price * item.quantity).toLocaleString('id-ID')}
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
                            <span className="text-stone-900">Rp {order.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Ongkos Kirim</span>
                            <span className="text-stone-900">Rp {order.shippingFee.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="border-t border-dashed border-gray-200 my-2"></div>
                        <div className="flex justify-between">
                            <span className="font-bold text-stone-900">Total</span>
                            <span className="font-bold text-orange-600">Rp {order.total.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-500">Metode Pembayaran</p>
                        <p className="font-medium text-stone-900">{order.paymentMethod}</p>
                    </div>
                </div>

                {/* Action Button */}
                <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-all">
                    Hubungi Kurir
                </button>
            </main>
        </>
    );
}
