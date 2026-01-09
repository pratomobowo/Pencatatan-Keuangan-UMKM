'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    timestamp: number;
    read: boolean;
}

export interface ToastItem {
    id: string;
    message: string;
    type: NotificationType;
}

interface NotificationContextType {
    notifications: NotificationItem[];
    addNotification: (title: string, message: string, type?: NotificationType) => void;
    markAsRead: (id?: string) => void;
    clearNotifications: () => void;
    unreadCount: number;
    toasts: ToastItem[];
    removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('pasarantar-notifications');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setNotifications(parsed);
            } catch (e) {
                console.error('Error loading notifications:', e);
            }
        }
        setIsInitialized(true);
    }, []);

    // Save to localStorage
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('pasarantar-notifications', JSON.stringify(notifications));
        }
    }, [notifications, isInitialized]);

    const addNotification = useCallback((title: string, message: string, type: NotificationType = 'info') => {
        const id = Date.now().toString();

        // Add to history
        const newItem: NotificationItem = {
            id,
            title,
            message,
            type,
            timestamp: Date.now(),
            read: false
        };

        setNotifications(prev => [newItem, ...prev].slice(0, 50)); // Keep last 50

        // Show toast
        const newToast: ToastItem = {
            id,
            message,
            type
        };
        setToasts(prev => [...prev, newToast]);

        // Auto remove toast after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const markAsRead = useCallback((id?: string) => {
        setNotifications(prev => prev.map(n =>
            (id === undefined || n.id === id) ? { ...n, read: true } : n
        ));
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            addNotification,
            markAsRead,
            clearNotifications,
            unreadCount,
            toasts,
            removeToast
        }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

// UI Components
const ToastContainer: React.FC<{ toasts: ToastItem[], removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-24 left-0 z-[100] flex flex-col gap-2 w-full max-w-md px-4 pointer-events-none">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className="animate-slide-in-left bg-stone-900 border border-stone-800 text-white px-4 py-3 rounded-r-2xl shadow-2xl flex items-center justify-between gap-3 pointer-events-auto"
                >
                    <div className="flex items-center gap-2">
                        {toast.type === 'success' && <div className="size-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>}
                        <p className="text-sm font-medium">{toast.message}</p>
                    </div>
                    <button onClick={() => removeToast(toast.id)} className="text-stone-400 hover:text-white">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            ))}
        </div>
    );
};
