'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';

export interface CartItem {
    id: string;
    name: string;
    variant: string;
    price: number;
    originalPrice?: number;
    quantity: number;
    image: string;
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
    removeItem: (id: string, variant: string) => void;
    updateQuantity: (id: string, variant: string, quantity: number) => void;
    clearCart: () => void;
    itemCount: number;
    subtotal: number;
    totalSavings: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const { addNotification } = useNotifications();
    const [items, setItems] = useState<CartItem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('pasarantar-cart');
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch (e) {
                console.error('Error loading cart:', e);
            }
        }
        setIsInitialized(true);
    }, []);

    // Save cart to localStorage on change
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('pasarantar-cart', JSON.stringify(items));
        }
    }, [items, isInitialized]);

    const addItem = (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
        setItems(currentItems => {
            const existingItem = currentItems.find(i => i.id === item.id && i.variant === item.variant);

            if (existingItem) {
                return currentItems.map(i =>
                    i.id === item.id && i.variant === item.variant
                        ? { ...i, quantity: i.quantity + quantity }
                        : i
                );
            }

            return [...currentItems, { ...item, quantity }];
        });

        addNotification('Keranjang', `${item.name} berhasil ditambahkan!`, 'success');
    };

    const removeItem = (id: string, variant: string) => {
        setItems(currentItems => currentItems.filter(item => !(item.id === id && item.variant === variant)));
    };

    const updateQuantity = (id: string, variant: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(id, variant);
            return;
        }
        setItems(currentItems =>
            currentItems.map(item =>
                item.id === id && item.variant === variant ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('pasarantar-cart');
        }
    };

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalSavings = items.reduce((sum, item) => {
        if (item.originalPrice && item.originalPrice > item.price) {
            return sum + (item.originalPrice - item.price) * item.quantity;
        }
        return sum;
    }, 0);

    return (
        <CartContext.Provider value={{
            items,
            addItem,
            removeItem,
            updateQuantity,
            clearCart,
            itemCount,
            subtotal,
            totalSavings,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
