'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Transaction, ViewState, Order, Product, Customer, CostComponent } from '@/lib/types';
import { Dashboard } from '@/components/Dashboard';
import { TransactionManager } from '@/components/TransactionManager';
import { OrderManager } from '@/components/OrderManager';
import { ProductManager } from '@/components/ProductManager';
import { CustomerManager } from '@/components/CustomerManager';
import { ReportManager } from '@/components/ReportManager';
import { AIAdvisor } from '@/components/AIAdvisor';
import { HPPCalculator } from '@/components/HPPCalculator';
import { UserManager } from '@/components/UserManager';
import { Profile } from '@/components/Profile';
import { ShopSettingsManager } from '@/components/ShopSettingsManager';
import { BannerManager } from '@/components/BannerManager';
import { CategoryManager } from '@/components/CategoryManager';
import { LoyaltyManager } from '@/components/LoyaltyManager';
import { NotificationSettingsManager } from '@/components/NotificationSettingsManager';
import { ChatLogManager } from '@/components/admin/ChatLogManager';
import { GowaSettingsManager } from '@/components/GowaSettingsManager';
import { RecipeManager } from '@/components/admin/RecipeManager';
import { UnitManager } from '@/components/admin/UnitManager';
import ProcurementManager from '@/components/ProcurementManager';
import { CouponManager } from '@/components/admin/CouponManager';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { ToastProvider, useToast } from '@/components/ui/Toast';

// Custom Hooks
import { useAdminData } from '@/hooks/useAdminData';
import { useOrderHandlers } from '@/hooks/useOrderHandlers';
import { useProductHandlers } from '@/hooks/useProductHandlers';
import { useCustomerHandlers } from '@/hooks/useCustomerHandlers';
import { useTransactionHandlers } from '@/hooks/useTransactionHandlers';
import { useCostComponentHandlers } from '@/hooks/useCostComponentHandlers';
import { useUserHandlers } from '@/hooks/useUserHandlers';

// Layout Components
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';

const App: React.FC = () => {
    const { data: session } = useSession();
    const toast = useToast();
    const isAdmin = (session?.user as any)?.role === 'admin';

    // View State
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Initialize view from URL or default to DASHBOARD
    const [view, setViewState] = useState<ViewState>((searchParams.get('view') as ViewState) || 'DASHBOARD');

    const setView = (newView: ViewState) => {
        setViewState(newView);
        const params = new URLSearchParams(searchParams);
        params.set('view', newView);
        router.replace(`${pathname}?${params.toString()}`);
    };

    // Sync URL changes back to state (e.g. back button)
    useEffect(() => {
        const viewParam = searchParams.get('view') as ViewState;
        if (viewParam && viewParam !== view) {
            setViewState(viewParam);
        }
    }, [searchParams]);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [quickOrderCustomerId, setQuickOrderCustomerId] = useState<string | null>(null);

    // Data from custom hook
    const {
        transactions, orders, products, customers, costComponents, users, loading, summary,
        setTransactions, setOrders, setProducts, setCustomers, setCostComponents, setUsers,
    } = useAdminData(isAdmin);

    // CRUD Handlers from custom hooks
    const { addOrder, updateOrder, updateOrderStatus, deleteOrder, deleteBulkOrders } = useOrderHandlers({
        setOrders, setProducts, setCustomers, setTransactions,
    });

    const { addProduct, updateProduct, deleteProduct } = useProductHandlers({
        setProducts, toast,
    });

    const { addCustomer, updateCustomer, deleteCustomer } = useCustomerHandlers({
        setCustomers, toast,
    });

    const { addTransaction, deleteTransaction } = useTransactionHandlers({
        setTransactions, toast,
    });

    const { addCostComponent, deleteCostComponent } = useCostComponentHandlers({
        setCostComponents, toast,
    });

    const { createUser, updateUser, deleteUser } = useUserHandlers({
        setUsers, toast,
    });

    // Quick Order Handler
    const handleQuickOrder = (customerId: string) => {
        setQuickOrderCustomerId(customerId);
        setView('ORDERS');
    };

    // Backup Handler
    const handleBackup = () => {
        const data = {
            timestamp: new Date().toISOString(),
            transactions,
            orders,
            products,
            customers,
            costComponents
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Pasarantar_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Loading State
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    // View Title & Description
    const viewMeta: Partial<Record<ViewState, { title: string; description: string }>> = {
        DASHBOARD: { title: 'Dashboard Pasarantar', description: 'Pantau arus kas penjualan protein dan biaya operasional.' },
        REPORTS: { title: 'Laporan Keuangan Bulanan', description: 'Evaluasi keuntungan bersih, aset, dan performa produk secara mendalam.' },
        ORDERS: { title: 'Manajemen Pesanan', description: 'Kelola semua pesanan (manual dan online).' },
        PRODUCTS: { title: 'Katalog Produk', description: 'Atur daftar harga, stok (inventory), dan HPP dasar.' },
        HPP_CALCULATOR: { title: 'Kalkulator & Resep HPP', description: 'Rakit harga modal detail (Bahan Baku + Kemasan + Ops) sebelum dijual.' },
        CUSTOMERS: { title: 'Database Pelanggan', description: 'Kelola semua data pelanggan (POS dan online).' },
        TRANSACTIONS: { title: 'Buku Kas Harian', description: 'Catat pembelian pasar, penjualan customer, dan biaya lain.' },
        ANALYSIS: { title: 'Konsultan AI', description: 'Evaluasi performa penjualan dan efisiensi pengiriman.' },
        LOYALTY_MANAGEMENT: { title: 'Program Loyalitas Customer', description: 'Kelola poin belanja, katalog hadiah, dan level (tier) pelanggan.' },
        USER_MANAGEMENT: { title: 'User Management', description: 'Manage system users, roles, and permissions.' },
        PROFILE: { title: 'Profile', description: 'Update your account information and change password.' },
        SHOP_SETTINGS: { title: 'Store Settings', description: 'Update FAQ, jam operasional, dan info pembayaran toko.' },
        BANNER_MANAGEMENT: { title: 'Manajemen Banner Promo', description: 'Atur visual dan teks banner yang tampil di halaman depan toko.' },
        CATEGORY_MANAGEMENT: { title: 'Manajemen Kategori Produk', description: 'Atur kategori produk untuk mempermudah navigasi di toko online.' },
        CHAT_LOGS: { title: 'AI Chat Conversations', description: 'Review interaksi konsumen dengan Minsar AI untuk mempelajari perilaku pasar.' },
        GOWA_SETTINGS: { title: 'WhatsApp Gateway (GOWA v8)', description: 'Konfigurasi integrasi WhatsApp untuk pengiriman OTP dan notifikasi.' },
        RECIPE_MANAGEMENT: { title: 'Manajemen Buku Resep', description: 'Moderasi resep yang dikirim pelanggan, review format AI, dan setujui untuk memberi poin.' },
        UNIT_MANAGEMENT: { title: 'Manajemen Unit Produk', description: 'Atur satuan produk (kg, pcs, pack) untuk standarisasi sistem.' },
        COUPON_MANAGEMENT: { title: 'Kupon Promo', description: 'Kelola kode diskon dan voucher untuk pelanggan.' },
        NOTIFICATIONS: { title: 'Pengaturan Notifikasi', description: 'Atur pesan otomatis untuk pelanggan dan admin via WhatsApp.' },
        PROCUREMENT: { title: 'Rekap Belanja Harian', description: 'Kelola daftar belanja, input harga modal, dan pengeluaran tim procurement.' },
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Mobile Navigation */}
            <AdminMobileNav
                view={view}
                setView={setView}
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
            />

            <div className="flex flex-1 relative">
                {/* Sidebar Navigation */}
                <AdminSidebar
                    view={view}
                    setView={setView}
                    isAdmin={isAdmin}
                    mobileMenuOpen={mobileMenuOpen}
                    setMobileMenuOpen={setMobileMenuOpen}
                    onBackup={handleBackup}
                />

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen bg-slate-50/50 pb-24 lg:pb-8">
                    <header className="mb-8 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-semibold text-slate-800">
                                {viewMeta[view]?.title || 'Dashboard'}
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">
                                {viewMeta[view]?.description || ''}
                            </p>
                        </div>
                    </header>

                    {/* View Content */}
                    {view === 'DASHBOARD' && (
                        <Dashboard transactions={transactions} summary={summary} products={products} />
                    )}

                    {view === 'REPORTS' && (
                        <ReportManager transactions={transactions} products={products} orders={orders} />
                    )}

                    {view === 'TRANSACTIONS' && (
                        <TransactionManager
                            transactions={transactions}
                            onAddTransaction={addTransaction}
                            onDeleteTransaction={deleteTransaction}
                        />
                    )}

                    {view === 'ORDERS' && (
                        <OrderManager
                            orders={orders}
                            products={products}
                            customers={customers}
                            onAddOrder={addOrder}
                            onUpdateOrder={updateOrder}
                            onUpdateStatus={(id, status) => updateOrderStatus(id, status, orders)}
                            onDeleteOrder={deleteOrder}
                            onBulkDelete={deleteBulkOrders}
                            initialCustomerId={quickOrderCustomerId}
                            onClearInitialCustomer={() => setQuickOrderCustomerId(null)}
                        />
                    )}

                    {view === 'PRODUCTS' && (
                        <ProductManager
                            products={products}
                            onAddProduct={addProduct}
                            onUpdateProduct={updateProduct}
                            onDeleteProduct={deleteProduct}
                            onAddTransaction={addTransaction}
                        />
                    )}

                    {view === 'HPP_CALCULATOR' && (
                        <HPPCalculator
                            savedComponents={costComponents}
                            onAddCostComponent={addCostComponent}
                            onDeleteCostComponent={deleteCostComponent}
                            onSaveProduct={addProduct}
                        />
                    )}

                    {view === 'CUSTOMERS' && (
                        <CustomerManager
                            customers={customers}
                            onAddCustomer={addCustomer}
                            onUpdateCustomer={updateCustomer}
                            onDeleteCustomer={deleteCustomer}
                            onQuickOrder={handleQuickOrder}
                        />
                    )}

                    {view === 'SHOP_SETTINGS' && <ShopSettingsManager />}
                    {view === 'BANNER_MANAGEMENT' && <BannerManager />}
                    {view === 'CATEGORY_MANAGEMENT' && <CategoryManager />}
                    {view === 'UNIT_MANAGEMENT' && <UnitManager />}
                    {view === 'COUPON_MANAGEMENT' && <CouponManager />}
                    {view === 'LOYALTY_MANAGEMENT' && <LoyaltyManager />}

                    {view === 'USER_MANAGEMENT' && isAdmin && (
                        <UserManager
                            users={users}
                            onCreateUser={createUser}
                            onUpdateUser={updateUser}
                            onDeleteUser={deleteUser}
                        />
                    )}

                    {view === 'PROFILE' && session?.user && (
                        <Profile
                            user={{
                                id: (session.user as any).id,
                                email: session.user.email || '',
                                name: session.user.name || '',
                                role: (session.user as any).role || 'user',
                            }}
                            onChangePassword={async (oldPassword, newPassword) => {
                                const response = await fetch('/api/users/change-password', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ oldPassword, newPassword }),
                                });

                                if (!response.ok) {
                                    const error = await response.json();
                                    throw new Error(error.error || 'Failed to change password');
                                }
                            }}
                        />
                    )}

                    {view === 'ANALYSIS' && (
                        <AIAdvisor transactions={transactions} />
                    )}

                    {view === 'CHAT_LOGS' && (
                        <ChatLogManager />
                    )}

                    {view === 'GOWA_SETTINGS' && (
                        <GowaSettingsManager />
                    )}

                    {view === 'RECIPE_MANAGEMENT' && (
                        <RecipeManager />
                    )}
                    {view === 'NOTIFICATIONS' && (
                        <NotificationSettingsManager />
                    )}
                    {view === 'PROCUREMENT' && (
                        <ProcurementManager />
                    )}
                </main>
            </div>
        </div>
    );
};

// Wrap App with ToastProvider
const AppWithToast: React.FC = () => (
    <ToastProvider>
        <App />
    </ToastProvider>
);

export default AppWithToast;
