'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, ShoppingCart, X, Clock } from 'lucide-react';

interface OrderNotification {
    id: string;
    orderNumber: string;
    customerName: string;
    grandTotal: number;
    createdAt: string;
    status: string;
}

interface AdminNotificationBellProps {
    onViewOrder?: () => void;
}

export const AdminNotificationBell: React.FC<AdminNotificationBellProps> = ({ onViewOrder }) => {
    const [notifications, setNotifications] = useState<OrderNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch pending orders
    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/admin/notifications/orders');
            if (res.ok) {
                const data = await res.json();

                // Check if there are new orders since last fetch
                if (lastFetchedAt && data.length > 0) {
                    const newOrders = data.filter((order: OrderNotification) =>
                        new Date(order.createdAt) > lastFetchedAt
                    );
                    if (newOrders.length > 0) {
                        // Play notification sound
                        playNotificationSound();
                    }
                }

                setNotifications(data);
                setLastFetchedAt(new Date());
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    const playNotificationSound = () => {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.3;

            oscillator.start();
            setTimeout(() => {
                oscillator.stop();
            }, 200);
        } catch (e) {
            console.log('Audio not supported');
        }
    };

    // Poll for new orders every 10 seconds
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, []);

    // Update dropdown position when opened
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 8,
                left: rect.left,
            });
        }
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)} jam lalu`;
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    const pendingCount = notifications.filter(n => n.status === 'PENDING').length;

    // Render dropdown via portal
    const dropdownContent = isOpen && typeof document !== 'undefined' ? createPortal(
        <div
            ref={dropdownRef}
            className="fixed w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
            style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                zIndex: 9999,
            }}
        >
            <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-slate-900 text-sm">Pesanan Masuk</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={16} />
                </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm">
                        <Bell size={32} className="mx-auto mb-2 text-slate-300" />
                        <p>Tidak ada pesanan baru</p>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div
                            key={notif.id}
                            className={`p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${notif.status === 'PENDING' ? 'bg-orange-50/50' : ''
                                }`}
                            onClick={() => {
                                setIsOpen(false);
                                if (onViewOrder) onViewOrder();
                            }}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`size-9 rounded-full flex items-center justify-center shrink-0 ${notif.status === 'PENDING' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    <ShoppingCart size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-medium text-sm text-slate-900 truncate">
                                            {notif.customerName}
                                        </p>
                                        <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded ${notif.status === 'PENDING'
                                            ? 'bg-orange-100 text-orange-700'
                                            : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {notif.status === 'PENDING' ? 'Baru' : notif.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500">{notif.orderNumber}</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-xs font-semibold text-slate-700">
                                            {formatCurrency(notif.grandTotal)}
                                        </p>
                                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <Clock size={10} />
                                            {formatTime(notif.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {notifications.length > 0 && (
                <div className="p-2 border-t border-slate-100 bg-slate-50">
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            if (onViewOrder) onViewOrder();
                        }}
                        className="w-full text-center text-xs text-blue-600 font-medium py-2 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        Lihat Semua Pesanan →
                    </button>
                </div>
            )}
        </div>,
        document.body
    ) : null;

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
                <Bell size={22} className="text-slate-600" />
                {pendingCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 animate-pulse">
                        {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                )}
            </button>

            {dropdownContent}
        </div>
    );
};
