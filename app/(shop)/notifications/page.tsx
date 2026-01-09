'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Bell, Loader2, CheckCheck, Trash2 } from 'lucide-react';
import { useShopAuth } from '@/contexts/ShopAuthContext';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    isRead: boolean;
    createdAt: string;
}

export default function NotificationsPage() {
    const { isAuthenticated, isLoading: authLoading } = useShopAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
        } else if (!authLoading) {
            setIsLoading(false);
        }
    }, [isAuthenticated, authLoading]);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/shop/notifications');
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const markAllRead = async () => {
        try {
            const response = await fetch('/api/shop/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: null })
            });

            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const response = await fetch('/api/shop/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [id] })
            });

            if (response.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            }
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <header className="bg-white border-b sticky top-0 z-20 px-4 py-3 flex items-center gap-4">
                    <Link href="/account" className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                        <ChevronLeft size={24} className="text-gray-700" />
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900">Notifikasi</h1>
                </header>
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin text-orange-500" size={40} />
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col text-stone-900">
                <header className="bg-white border-b sticky top-0 z-20 px-4 py-3 flex items-center gap-4">
                    <Link href="/account" className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                        <ChevronLeft size={24} className="text-gray-700" />
                    </Link>
                    <h1 className="text-lg font-bold">Notifikasi</h1>
                </header>
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="size-20 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                        <Bell size={40} className="text-orange-500" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Belum Login</h2>
                    <p className="text-gray-500 mb-6">Silakan login untuk melihat notifikasi Anda.</p>
                    <Link
                        href="/login"
                        className="bg-orange-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all"
                    >
                        Masuk Sekarang
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pb-24 text-stone-900">
            <header className="bg-white border-b sticky top-0 z-20 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/account" className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                        <ChevronLeft size={24} className="text-gray-700" />
                    </Link>
                    <h1 className="text-lg font-bold">Notifikasi</h1>
                </div>
                {notifications.some(n => !n.isRead) && (
                    <button
                        onClick={markAllRead}
                        className="text-orange-500 text-sm font-semibold flex items-center gap-1 hover:text-orange-600"
                    >
                        <CheckCheck size={18} />
                        Baca Semua
                    </button>
                )}
            </header>

            <main className="flex-1">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="size-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Bell size={40} className="text-gray-300" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Belum Ada Notifikasi</h2>
                        <p className="text-gray-500">Kabar terbaru pesanan Anda akan muncul di sini.</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {notifications.map((notif) => (
                            <div
                                key={notif.id}
                                onClick={() => !notif.isRead && markAsRead(notif.id)}
                                className={`p-4 border-b flex gap-4 transition-colors cursor-pointer ${notif.isRead ? 'bg-white' : 'bg-orange-50/50'}`}
                            >
                                <div className={`size-12 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'success' ? 'bg-green-100 text-green-600' :
                                        notif.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                            notif.type === 'error' ? 'bg-red-100 text-red-600' :
                                                'bg-orange-100 text-orange-600'
                                    }`}>
                                    <Bell size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`font-bold text-sm ${notif.isRead ? 'text-gray-800' : 'text-stone-900'}`}>
                                            {notif.title}
                                            {!notif.isRead && <span className="ml-2 inline-block size-2 rounded-full bg-orange-500" />}
                                        </h3>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                            {new Date(notif.createdAt).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <p className={`text-sm line-clamp-2 ${notif.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                                        {notif.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
