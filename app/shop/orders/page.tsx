'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';

type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

interface Order {
    id: string;
    orderNumber: string;
    date: string;
    status: OrderStatus;
    items: { name: string; quantity: number; image: string }[];
    total: number;
}

// Mock orders - will be replaced with API
const mockOrders: Order[] = [
    {
        id: '1',
        orderNumber: 'ORD-2024-001',
        date: '8 Jan 2024',
        status: 'processing',
        items: [
            { name: 'Salmon Fillet', quantity: 1, image: 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=200&q=80' },
            { name: 'Udang Vaname', quantity: 2, image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=200&q=80' },
        ],
        total: 214000,
    },
    {
        id: '2',
        orderNumber: 'ORD-2024-002',
        date: '5 Jan 2024',
        status: 'completed',
        items: [
            { name: 'Daging Rendang', quantity: 1, image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=200&q=80' },
        ],
        total: 135000,
    },
];

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    processing: { label: 'Diproses', color: 'bg-blue-100 text-blue-700', icon: Package },
    completed: { label: 'Selesai', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const tabs = [
    { id: 'all', name: 'Semua' },
    { id: 'processing', name: 'Diproses' },
    { id: 'completed', name: 'Selesai' },
];

export default function OrdersPage() {
    const [activeTab, setActiveTab] = useState('all');

    const filteredOrders = activeTab === 'all'
        ? mockOrders
        : mockOrders.filter(o => o.status === activeTab);

    return (
        <>
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm">
                <div className="flex items-center px-4 py-3 justify-between">
                    <Link href="/shop/account" className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-orange-50">
                        <ArrowLeft size={24} />
                    </Link>
                    <h2 className="text-stone-900 text-lg font-bold flex-1 text-center pr-10">Pesanan Saya</h2>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 px-4 pb-3">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-stone-100 text-gray-600 hover:bg-stone-200'
                                }`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>
            </header>

            {/* Orders List */}
            <main className="p-4 pb-24 flex flex-col gap-4">
                {filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Package size={64} className="text-gray-300 mb-4" />
                        <p className="text-gray-500 mb-2">Belum ada pesanan</p>
                        <Link
                            href="/shop"
                            className="text-orange-500 font-bold"
                        >
                            Mulai Belanja
                        </Link>
                    </div>
                ) : (
                    filteredOrders.map((order) => {
                        const StatusIcon = statusConfig[order.status].icon;
                        return (
                            <Link
                                key={order.id}
                                href={`/shop/orders/${order.id}`}
                                className="bg-white rounded-2xl shadow-sm border border-orange-50 overflow-hidden hover:border-orange-200 transition-colors"
                            >
                                {/* Order Header */}
                                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                    <div>
                                        <p className="text-sm font-bold text-stone-900">{order.orderNumber}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{order.date}</p>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[order.status].color}`}>
                                        <StatusIcon size={14} />
                                        {statusConfig[order.status].label}
                                    </div>
                                </div>

                                {/* Order Items Preview */}
                                <div className="p-4 flex items-center gap-3">
                                    <div className="flex -space-x-3">
                                        {order.items.slice(0, 3).map((item, i) => (
                                            <div key={i} className="size-12 rounded-lg border-2 border-white overflow-hidden relative">
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-600">
                                            {order.items.map(i => i.name).join(', ')}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {order.items.reduce((sum, i) => sum + i.quantity, 0)} item
                                        </p>
                                    </div>
                                </div>

                                {/* Order Footer */}
                                <div className="flex items-center justify-between p-4 bg-stone-50 border-t border-gray-100">
                                    <div>
                                        <p className="text-xs text-gray-500">Total Pembayaran</p>
                                        <p className="text-base font-bold text-stone-900">
                                            Rp {order.total.toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <ChevronRight size={20} className="text-gray-400" />
                                </div>
                            </Link>
                        );
                    })
                )}
            </main>
        </>
    );
}
