'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
}

interface AuthContextType {
    customer: Customer | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (phoneOrEmail: string, password: string, isEmail?: boolean) => Promise<{ success: boolean; error?: string; redirectTo?: string }>;
    register: (data: { name: string; phone: string; password: string; email?: string }) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    refreshCustomer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function ShopAuthProvider({ children }: { children: ReactNode }) {
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await fetch('/api/shop/customers/me');
            if (response.ok) {
                const data = await response.json();
                setCustomer(data);
            } else {
                setCustomer(null);
            }
        } catch {
            setCustomer(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (phoneOrEmail: string, password: string, isEmail = false) => {
        try {
            const response = await fetch('/api/shop/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: !isEmail ? phoneOrEmail : undefined,
                    email: isEmail ? phoneOrEmail : undefined,
                    password
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, error: data.error };
            }

            // Refresh customer data to get full profile
            await refreshCustomer();

            return { success: true, redirectTo: data.redirectTo };
        } catch (error) {
            return { success: false, error: 'Gagal login' };
        }
    };

    const register = async (registerData: { name: string; phone: string; password: string; email?: string }) => {
        try {
            const response = await fetch('/api/shop/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registerData),
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, error: data.error };
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: 'Gagal registrasi' };
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/shop/auth/logout', { method: 'POST' });
        } catch {
            // Ignore errors
        }
        setCustomer(null);
        router.push('/shop');
    };

    const refreshCustomer = async () => {
        await checkAuth();
    };

    return (
        <AuthContext.Provider value={{
            customer,
            isLoading,
            isAuthenticated: !!customer,
            login,
            register,
            logout,
            refreshCustomer,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useShopAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useShopAuth must be used within a ShopAuthProvider');
    }
    return context;
}
