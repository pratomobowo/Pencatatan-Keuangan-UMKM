'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useShopAuth } from '@/contexts/ShopAuthContext';

export interface CartItem {
    id: string;
    name: string;
    variant: string;
    price: number;
    originalPrice?: number;
    quantity: number;
    image: string;
    note?: string;
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
    removeItem: (id: string, variant: string) => void;
    updateQuantity: (id: string, variant: string, quantity: number) => void;
    updateNote: (id: string, variant: string, note: string) => void;
    clearCart: () => void;
    itemCount: number;
    subtotal: number;
    totalSavings: number;
    // Coupon Logic
    couponCode: string | null;
    couponDiscount: number;
    couponType: string | null;
    applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
    removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const { addNotification } = useNotifications();
    const { isAuthenticated, isLoading: authLoading } = useShopAuth();
    const [items, setItems] = useState<CartItem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Coupon State
    const [couponCode, setCouponCode] = useState<string | null>(null);
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [couponType, setCouponType] = useState<string | null>(null);

    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initial load from localStorage
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

    // Handle authentication change: Fetch from DB and Merge if needed
    useEffect(() => {
        if (!isInitialized || authLoading) return;

        if (isAuthenticated) {
            fetchAndMergeCart();
        }
    }, [isAuthenticated, authLoading, isInitialized]);

    const fetchAndMergeCart = async () => {
        try {
            const res = await fetch('/api/shop/cart');
            if (res.ok) {
                const dbData = await res.json();
                const dbItems: CartItem[] = dbData.items || [];

                setItems(currentItems => {
                    // Logic: Merge guest items into DB items
                    // If item exists in both, use the max quantity or keep DB?
                    // Usually, for "shopping as guest then login", we merge.
                    const mergedItems = [...dbItems];

                    currentItems.forEach(guestItem => {
                        const existingIdx = mergedItems.findIndex(i => i.id === guestItem.id && i.variant === guestItem.variant);
                        if (existingIdx > -1) {
                            // Already in DB, maybe update quantity if guest has more? 
                            // Or just keep DB as source of truth? 
                            // Let's use max quantity to be helpful.
                            mergedItems[existingIdx].quantity = Math.max(mergedItems[existingIdx].quantity, guestItem.quantity);
                        } else {
                            mergedItems.push(guestItem);
                        }
                    });

                    // Trigger a sync if we added guest items
                    if (currentItems.length > 0) {
                        syncCartToDB(mergedItems);
                    }

                    return mergedItems;
                });
            }
        } catch (error) {
            console.error('Error fetching/merging cart:', error);
        }
    };

    const syncCartToDB = async (cartItems: CartItem[]) => {
        if (!isAuthenticated) return;

        try {
            await fetch('/api/shop/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: cartItems }),
            });
        } catch (error) {
            console.error('Error syncing cart to DB:', error);
        }
    };

    // Save to localStorage & Sync to DB on change
    useEffect(() => {
        if (!isInitialized) return;

        localStorage.setItem('pasarantar-cart', JSON.stringify(items));

        // Recalculate coupon if items change (e.g. subtotal drops below min purchase)
        if (couponCode) {
            verifyCoupon(couponCode); // Re-verify silently
        }

        // Debounce DB sync to avoid excessive requests
        if (isAuthenticated) {
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
            syncTimeoutRef.current = setTimeout(() => {
                syncCartToDB(items);
            }, 1000);
        }
    }, [items, isInitialized, isAuthenticated]);

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

    const updateNote = (id: string, variant: string, note: string) => {
        setItems(currentItems =>
            currentItems.map(item =>
                item.id === id && item.variant === variant ? { ...item, note } : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
        setCouponCode(null);
        setCouponDiscount(0);
        setCouponType(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('pasarantar-cart');
        }
        // DB clear is handled by the orders API automatically on success
    };

    // --- Coupon Logic ---
    const applyCoupon = async (code: string) => {
        const result = await verifyCoupon(code);
        if (result.success) {
            setCouponCode(code);
        }
        return result;
    };

    const removeCoupon = () => {
        setCouponCode(null);
        setCouponDiscount(0);
        setCouponType(null);
    };

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const verifyCoupon = async (code: string) => {
        try {
            const res = await fetch('/api/shop/coupons/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, subtotal }),
            });

            const data = await res.json();

            if (res.ok && data.valid) {
                setCouponDiscount(data.discount);
                setCouponType(data.type);
                return { success: true, message: data.message };
            } else {
                // Convert error to silent failure if re-verifying, but return error for explicit calls
                setCouponDiscount(0); // Reset discount if invalid
                return { success: false, message: data.error || 'Kupon tidak valid' };
            }
        } catch (error) {
            return { success: false, message: 'Gagal memverifikasi kupon' };
        }
    };

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
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
            updateNote,
            clearCart,
            itemCount,
            subtotal,
            totalSavings,
            couponCode,
            couponDiscount,
            couponType,
            applyCoupon,
            removeCoupon
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
