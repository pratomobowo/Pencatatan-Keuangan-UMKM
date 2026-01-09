// API utility functions for frontend
import { Product, Customer, Order, Transaction, CostComponent, User, ShopOrder, ShopCustomer, ShopOrderStatus } from '@/lib/types';

const API_BASE = '/api';

// Generic fetch wrapper
async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${url}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
        ...options,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
}

// Products API
export const productsAPI = {
    getAll: () => fetchAPI<Product[]>('/products'),
    getOne: (id: string) => fetchAPI<Product>(`/products/${id}`),
    create: (data: Omit<Product, 'id'>) => fetchAPI<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<Product>) => fetchAPI<Product>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchAPI<{ message: string }>(`/products/${id}`, {
        method: 'DELETE',
    }),
};

// Customers API
export const customersAPI = {
    getAll: () => fetchAPI<Customer[]>('/customers'),
    getOne: (id: string) => fetchAPI<Customer>(`/customers/${id}`),
    create: (data: Omit<Customer, 'id' | 'totalSpent' | 'orderCount' | 'lastOrderDate'>) =>
        fetchAPI<Customer>('/customers', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    update: (id: string, data: Partial<Customer>) => fetchAPI<Customer>(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchAPI<{ message: string }>(`/customers/${id}`, {
        method: 'DELETE',
    }),
};

// Orders API
export const ordersAPI = {
    getAll: () => fetchAPI<Order[]>('/orders'),
    getOne: (id: string) => fetchAPI<Order>(`/orders/${id}`),
    create: (data: any) => fetchAPI<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateStatus: (id: string, status: 'PENDING' | 'PAID' | 'CANCELLED' | ShopOrderStatus) =>
        fetchAPI<Order>(`/orders/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),
    delete: (id: string) => fetchAPI<{ message: string }>(`/orders/${id}`, {
        method: 'DELETE',
    }),
};

// Admin Shop Orders API
export const adminShopOrdersAPI = {
    getAll: () => fetchAPI<ShopOrder[]>('/admin/shop-orders'),
    getOne: (id: string) => fetchAPI<ShopOrder>(`/admin/shop-orders/${id}`),
    updateStatus: (id: string, status: ShopOrderStatus) =>
        fetchAPI<ShopOrder>(`/admin/shop-orders/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),
    delete: (id: string) => fetchAPI<{ message: string }>(`/admin/shop-orders/${id}`, {
        method: 'DELETE',
    }),
};

// Admin Shop Customers API
export const adminShopCustomersAPI = {
    getAll: () => fetchAPI<ShopCustomer[]>('/admin/shop-customers'),
    getOne: (id: string) => fetchAPI<ShopCustomer>(`/admin/shop-customers/${id}`),
};

// Transactions API
export const transactionsAPI = {
    getAll: () => fetchAPI<Transaction[]>('/transactions'),
    create: (data: Omit<Transaction, 'id' | 'createdAt'>) => fetchAPI<Transaction>('/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchAPI<{ message: string }>(`/transactions/${id}`, {
        method: 'DELETE',
    }),
};

// Cost Components API
export const costComponentsAPI = {
    getAll: () => fetchAPI<CostComponent[]>('/cost-components'),
    create: (data: Omit<CostComponent, 'id'>) => fetchAPI<CostComponent>('/cost-components', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchAPI<{ message: string }>(`/cost-components/${id}`, {
        method: 'DELETE',
    }),
};

// Users API
export const usersAPI = {
    getAll: () => fetchAPI<User[]>('/users'),
    getOne: (id: string) => fetchAPI<User>(`/users/${id}`),
    create: (data: { email: string; name: string; password: string; role: string }) =>
        fetchAPI<User>('/users', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    update: (id: string, data: Partial<User> & { password?: string }) =>
        fetchAPI<User>(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    delete: (id: string) => fetchAPI<{ message: string }>(`/users/${id}`, {
        method: 'DELETE',
    }),
    changePassword: (oldPassword: string, newPassword: string) =>
        fetchAPI<{ message: string }>('/users/change-password', {
            method: 'PUT',
            body: JSON.stringify({ oldPassword, newPassword }),
        }),
};

export const adminShopConfigAPI = {
    get: () => fetchAPI<any>('/admin/shop-config'),
    update: (data: any) => fetchAPI<any>('/admin/shop-config', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};
