'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, FinancialSummary, ViewState, Order, Product, Customer, CostComponent } from '@/lib/types';
import { Dashboard } from '@/components/Dashboard';
import { TransactionManager } from '@/components/TransactionManager';
import { OrderManager } from '@/components/OrderManager';
import { ProductManager } from '@/components/ProductManager';
import { CustomerManager } from '@/components/CustomerManager';
import { ReportManager } from '@/components/ReportManager';
import { AIAdvisor } from '@/components/AIAdvisor';
import { HPPCalculator } from '@/components/HPPCalculator';
import { LayoutDashboard, List, BrainCircuit, ShoppingCart, Package, Users, Download, PieChart, Calculator, LogOut } from 'lucide-react';
import { productsAPI, customersAPI, ordersAPI, transactionsAPI, costComponentsAPI } from '@/lib/api';
import { useSession, signOut } from 'next-auth/react';

const App: React.FC = () => {
    // State
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [costComponents, setCostComponents] = useState<CostComponent[]>([]);
    const [view, setView] = useState<ViewState>('DASHBOARD');
    const [loading, setLoading] = useState(true);

    // State for Quick Order Integration
    const [quickOrderCustomerId, setQuickOrderCustomerId] = useState<string | null>(null);

    // Load from API on Mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [txData, orderData, productData, customerData, costData] = await Promise.all([
                    transactionsAPI.getAll(),
                    ordersAPI.getAll(),
                    productsAPI.getAll(),
                    customersAPI.getAll(),
                    costComponentsAPI.getAll(),
                ]);
                setTransactions(txData);
                setOrders(orderData);
                setProducts(productData);
                setCustomers(customerData);
                setCostComponents(costData);
            } catch (error) {
                console.error('Failed to load data:', error);
                alert('Gagal memuat data dari database. Silakan refresh halaman.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Derived Summary
    const summary: FinancialSummary = useMemo(() => {
        const totalIncome = transactions
            .filter(t => t.type === TransactionType.INCOME)
            .reduce((acc, t) => acc + t.amount, 0);

        const totalExpense = transactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((acc, t) => acc + t.amount, 0);

        const totalCapital = transactions
            .filter(t => t.type === TransactionType.CAPITAL)
            .reduce((acc, t) => acc + t.amount, 0);

        const balance = (totalIncome + totalCapital) - totalExpense;
        const netProfit = totalIncome - totalExpense;

        return { totalIncome, totalExpense, totalCapital, balance, netProfit };
    }, [transactions]);

    // Handlers - Transactions
    const addTransaction = async (t: Omit<Transaction, 'id'>) => {
        try {
            const newTransaction = await transactionsAPI.create(t);
            setTransactions(prev => [newTransaction, ...prev]);
        } catch (error) {
            console.error('Failed to add transaction:', error);
            alert('Gagal menambah transaksi');
        }
    };

    const deleteTransaction = async (id: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
            try {
                await transactionsAPI.delete(id);
                setTransactions(prev => prev.filter(t => t.id !== id));
            } catch (error) {
                console.error('Failed to delete transaction:', error);
                alert('Gagal menghapus transaksi');
            }
        }
    };

    // Handlers - Orders & Stock Logic
    const addOrder = async (order: Order) => {
        try {
            const newOrder = await ordersAPI.create(order);
            setOrders(prev => [newOrder, ...prev]);
            // Refresh products to get updated stock
            const updatedProducts = await productsAPI.getAll();
            setProducts(updatedProducts);
        } catch (error) {
            console.error('Failed to add order:', error);
            alert('Gagal menambah order');
        }
    };

    const updateOrderStatus = async (id: string, status: 'PAID' | 'CANCELLED') => {
        const orderToUpdate = orders.find(o => o.id === id);
        if (!orderToUpdate) return;

        const confirmMessage = status === 'CANCELLED'
            ? 'Batalkan order ini? Stok produk akan dikembalikan otomatis.'
            : `Ubah status order ini menjadi ${status}?`;

        if (confirm(confirmMessage)) {
            try {
                await ordersAPI.updateStatus(id, status);
                // Refresh all data to get updated values
                const [updatedOrders, updatedProducts, updatedCustomers, updatedTransactions] = await Promise.all([
                    ordersAPI.getAll(),
                    productsAPI.getAll(),
                    customersAPI.getAll(),
                    transactionsAPI.getAll(),
                ]);
                setOrders(updatedOrders);
                setProducts(updatedProducts);
                setCustomers(updatedCustomers);
                setTransactions(updatedTransactions);

                if (status === 'PAID') {
                    alert('Order dilunasi! Transaksi dicatat dan total belanja pelanggan diupdate.');
                }
            } catch (error) {
                console.error('Failed to update order status:', error);
                alert('Gagal mengupdate status order');
            }
        }
    };

    const deleteOrder = async (id: string) => {
        if (confirm('Hapus order ini? Jika order belum dibatalkan, Stok akan dikembalikan.')) {
            try {
                await ordersAPI.delete(id);
                setOrders(prev => prev.filter(o => o.id !== id));
                // Refresh products to get updated stock
                const updatedProducts = await productsAPI.getAll();
                setProducts(updatedProducts);
            } catch (error) {
                console.error('Failed to delete order:', error);
                alert('Gagal menghapus order');
            }
        }
    };

    // Handlers - Products
    const addProduct = async (product: Product) => {
        try {
            const newProduct = await productsAPI.create(product);
            setProducts(prev => [...prev, newProduct]);
        } catch (error) {
            console.error('Failed to add product:', error);
            alert('Gagal menambah produk');
        }
    };

    const updateProduct = async (product: Product) => {
        try {
            await productsAPI.update(product.id, product);
            setProducts(prev => prev.map(p => p.id === product.id ? product : p));
        } catch (error) {
            console.error('Failed to update product:', error);
            alert('Gagal mengupdate produk');
        }
    };

    const deleteProduct = async (id: string) => {
        if (confirm('Hapus produk ini?')) {
            try {
                await productsAPI.delete(id);
                setProducts(prev => prev.filter(p => p.id !== id));
            } catch (error) {
                console.error('Failed to delete product:', error);
                alert('Gagal menghapus produk');
            }
        }
    };

    // Handlers - Customers
    const addCustomer = async (customer: Customer) => {
        try {
            const newCustomer = await customersAPI.create(customer);
            setCustomers(prev => [...prev, newCustomer]);
        } catch (error) {
            console.error('Failed to add customer:', error);
            alert('Gagal menambah pelanggan');
        }
    };

    const updateCustomer = async (customer: Customer) => {
        try {
            await customersAPI.update(customer.id, customer);
            setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
        } catch (error) {
            console.error('Failed to update customer:', error);
            alert('Gagal mengupdate pelanggan');
        }
    };

    const deleteCustomer = async (id: string) => {
        if (confirm('Hapus pelanggan ini?')) {
            try {
                await customersAPI.delete(id);
                setCustomers(prev => prev.filter(c => c.id !== id));
            } catch (error) {
                console.error('Failed to delete customer:', error);
                alert('Gagal menghapus pelanggan');
            }
        }
    };

    // Handlers - Cost Components
    const addCostComponent = async (cost: CostComponent) => {
        try {
            const newCost = await costComponentsAPI.create(cost);
            setCostComponents(prev => [...prev, newCost]);
        } catch (error) {
            console.error('Failed to add cost component:', error);
            alert('Gagal menambah komponen biaya');
        }
    };

    const deleteCostComponent = async (id: string) => {
        if (confirm('Hapus komponen biaya ini dari daftar?')) {
            try {
                await costComponentsAPI.delete(id);
                setCostComponents(prev => prev.filter(c => c.id !== id));
            } catch (error) {
                console.error('Failed to delete cost component:', error);
                alert('Gagal menghapus komponen biaya');
            }
        }
    };

    // Integration Handler: Quick Order from Customer List
    const handleQuickOrder = (customerId: string) => {
        setQuickOrderCustomerId(customerId);
        setView('ORDERS');
    };

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

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">

            {/* Sidebar Navigation - LIGHT THEME */}
            <aside className="w-full md:w-64 bg-white text-slate-800 flex-shrink-0 md:h-screen sticky top-0 z-50 border-r border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                    <div className="p-6 flex items-center gap-3 border-b border-slate-100">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg shadow-sm flex items-center justify-center">
                            <span className="text-white font-semibold text-lg tracking-tight">PA</span>
                        </div>
                        <div>
                            <h1 className="font-semibold text-lg leading-none text-slate-900">Pasarantar</h1>
                            <span className="text-xs text-slate-500">Keuangan & Stok</span>
                        </div>
                    </div>

                    <nav className="p-4 space-y-2">
                        <div className="text-xs font-medium text-slate-400 px-4 mb-2 mt-2 uppercase tracking-wider">Utama</div>
                        <button
                            onClick={() => setView('DASHBOARD')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'DASHBOARD'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                                }`}
                        >
                            <LayoutDashboard size={20} />
                            <span>Ringkasan</span>
                        </button>

                        <button
                            onClick={() => setView('ORDERS')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'ORDERS'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                                }`}
                        >
                            <ShoppingCart size={20} />
                            <span>Order Masuk</span>
                        </button>

                        <div className="text-xs font-medium text-slate-400 px-4 mb-2 mt-4 uppercase tracking-wider">Manajemen</div>
                        <button
                            onClick={() => setView('PRODUCTS')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'PRODUCTS'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                                }`}
                        >
                            <Package size={20} />
                            <span>Data Produk</span>
                        </button>

                        <button
                            onClick={() => setView('HPP_CALCULATOR')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'HPP_CALCULATOR'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                                }`}
                        >
                            <Calculator size={20} />
                            <span>Kalkulator HPP</span>
                        </button>

                        <button
                            onClick={() => setView('CUSTOMERS')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'CUSTOMERS'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                                }`}
                        >
                            <Users size={20} />
                            <span>Pelanggan</span>
                        </button>

                        <div className="text-xs font-medium text-slate-400 px-4 mb-2 mt-4 uppercase tracking-wider">Keuangan</div>
                        <button
                            onClick={() => setView('TRANSACTIONS')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'TRANSACTIONS'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                                }`}
                        >
                            <List size={20} />
                            <span>Buku Transaksi</span>
                        </button>

                        <button
                            onClick={() => setView('REPORTS')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'REPORTS'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                                }`}
                        >
                            <PieChart size={20} />
                            <span>Laporan Laba Rugi</span>
                        </button>

                        <div className="text-xs font-medium text-slate-400 px-4 mb-2 mt-4 uppercase tracking-wider">Insight</div>
                        <button
                            onClick={() => setView('ANALYSIS')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'ANALYSIS'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                                }`}
                        >
                            <BrainCircuit size={20} />
                            <span>Analisis Bisnis</span>
                        </button>
                    </nav>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2">
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 hover:bg-rose-100 text-sm transition-colors font-medium"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                    <button
                        onClick={handleBackup}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 text-sm transition-colors"
                    >
                        <Download size={16} /> Backup Data
                    </button>
                    <p className="text-xs text-slate-400 text-center mt-3">
                        &copy; 2024 Pasarantar v2.0
                    </p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen bg-slate-50/50">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-800">
                            {view === 'DASHBOARD' && 'Dashboard Pasarantar'}
                            {view === 'REPORTS' && 'Laporan Keuangan Bulanan'}
                            {view === 'ORDERS' && 'Manajemen Order'}
                            {view === 'PRODUCTS' && 'Katalog Produk'}
                            {view === 'HPP_CALCULATOR' && 'Kalkulator & Resep HPP'}
                            {view === 'CUSTOMERS' && 'Database Pelanggan'}
                            {view === 'TRANSACTIONS' && 'Buku Kas Harian'}
                            {view === 'ANALYSIS' && 'Konsultan AI'}
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">
                            {view === 'DASHBOARD' && 'Pantau arus kas penjualan protein dan biaya operasional.'}
                            {view === 'REPORTS' && 'Evaluasi keuntungan bersih, aset, dan performa produk secara mendalam.'}
                            {view === 'ORDERS' && 'Kelola pesanan pelanggan, invoice, dan status pembayaran.'}
                            {view === 'PRODUCTS' && 'Atur daftar harga, stok (inventory), dan HPP dasar.'}
                            {view === 'HPP_CALCULATOR' && 'Rakit harga modal detail (Bahan Baku + Kemasan + Ops) sebelum dijual.'}
                            {view === 'CUSTOMERS' && 'Kelola data kontak pelanggan dan riwayat belanja.'}
                            {view === 'TRANSACTIONS' && 'Catat pembelian pasar, penjualan customer, dan biaya lain.'}
                            {view === 'ANALYSIS' && 'Evaluasi performa penjualan dan efisiensi pengiriman.'}
                        </p>
                    </div>
                </header>

                {view === 'DASHBOARD' && (
                    <Dashboard
                        transactions={transactions}
                        summary={summary}
                        products={products} // Passed for inventory alerts
                    />
                )}

                {view === 'REPORTS' && (
                    <ReportManager transactions={transactions} orders={orders} products={products} />
                )}

                {view === 'ORDERS' && (
                    <OrderManager
                        orders={orders}
                        products={products}
                        customers={customers}
                        onAddOrder={addOrder}
                        onUpdateStatus={updateOrderStatus}
                        onDeleteOrder={deleteOrder}
                        initialCustomerId={quickOrderCustomerId} // Pass quick order request
                        onClearInitialCustomer={() => setQuickOrderCustomerId(null)} // Reset after handling
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
                        orders={orders}
                        onAddCustomer={addCustomer}
                        onUpdateCustomer={updateCustomer}
                        onDeleteCustomer={deleteCustomer}
                        onQuickOrder={handleQuickOrder} // Handler for quick order button
                    />
                )}

                {view === 'TRANSACTIONS' && (
                    <TransactionManager
                        transactions={transactions}
                        onAddTransaction={addTransaction}
                        onDeleteTransaction={deleteTransaction}
                    />
                )}

                {view === 'ANALYSIS' && (
                    <AIAdvisor transactions={transactions} />
                )}
            </main>
        </div>
    );
};

export default App;
