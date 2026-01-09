'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, ChevronRight, Loader2, Truck } from 'lucide-react';
import { useShopAuth } from '@/contexts/ShopAuthContext';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';

interface Order {
    id: string;
    orderNumber: string;
    date: string;
    status: OrderStatus;
    items: { name: string; quantity: number; image: string }[];
    total: number;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    confirmed: { label: 'Dikonfirmasi', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
    preparing: { label: 'Disiapkan', color: 'bg-purple-100 text-purple-700', icon: Package },
    shipping: { label: 'Dikirim', color: 'bg-cyan-100 text-cyan-700', icon: Truck },
    delivered: { label: 'Selesai', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const tabs = [
    { id: 'all', name: 'Semua' },
    { id: 'processing', name: 'Diproses' },
    { id: 'delivered', name: 'Selesai' },
];

export default function OrdersPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useShopAuth();
    const [activeTab, setActiveTab] = useState('all');
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }

        if (isAuthenticated) {
            fetchOrders();
        }
    }, [isAuthenticated, authLoading, activeTab]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/shop/orders?status=${activeTab}`);
            if (!response.ok) throw new Error('Failed to fetch orders');
            const data = await response.json();
            setOrders(data);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Gagal memuat pesanan');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-orange-500" size={40} />
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm">
                <div className="flex items-center px-4 py-3 justify-between">
                    <Link href="/account" className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-orange-50">
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
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-orange-500" size={40} />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <p className="text-red-500 mb-4">{error}</p>
                        <button onClick={fetchOrders} className="text-orange-500 font-bold">
                            Coba Lagi
                        </button>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Package size={64} className="text-gray-300 mb-4" />
                        <p className="text-gray-500 mb-2">Belum ada pesanan</p>
                        <Link
                            href="/"
                            className="text-orange-500 font-bold"
                        >
                            Mulai Belanja
                        </Link>
                    </div>
                ) : (
                    orders.map((order) => {
                        const StatusIcon = statusConfig[order.status]?.icon || Clock;
                        const statusStyle = statusConfig[order.status] || statusConfig.pending;

                        return (
                            <Link
                                key={order.id}
                                href={`/orders/${order.id}`}
                                className="bg-white rounded-2xl shadow-sm border border-orange-50 overflow-hidden hover:border-orange-200 transition-colors"
                            >
                                {/* Order Header */}
                                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                    <div>
                                        <p className="text-sm font-bold text-stone-900">{order.orderNumber}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{order.date}</p>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusStyle.color}`}>
                                        <StatusIcon size={14} />
                                        {statusStyle.label}
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
                                        <p className="text-sm text-gray-600 line-clamp-1">
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
