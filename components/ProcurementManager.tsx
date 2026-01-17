'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/Card';
import {
    ShoppingCart,
    RefreshCw,
    Calendar,
    Check,
    Package,
    Plus,
    Trash2,
    Receipt,
    Loader2,
    Coffee,
    Car,
    Fuel,
    CircleDollarSign,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

interface ProcurementItem {
    id: string;
    productId: string | null;
    productName: string;
    unit: string;
    totalQty: number;
    costPrice: number | null;
    isPurchased: boolean;
    notes: string | null;
}

interface ProcurementExpense {
    id: string;
    category: string;
    amount: number;
    description: string | null;
}

interface ProcurementSession {
    id: string;
    date: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
    totalCost: number;
    notes: string | null;
    items: ProcurementItem[];
    expenses: ProcurementExpense[];
    itemsTotal?: number;
    expensesTotal?: number;
    grandTotal?: number;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
};

const expenseCategories = [
    { value: 'parkir', label: 'Parkir', icon: Car },
    { value: 'kopi', label: 'Kopi/Makan', icon: Coffee },
    { value: 'bensin', label: 'Bensin', icon: Fuel },
    { value: 'lainnya', label: 'Lainnya', icon: CircleDollarSign }
];

export default function ProcurementManager() {
    const [session, setSession] = useState<ProcurementSession | null>(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [newExpense, setNewExpense] = useState({ category: 'parkir', amount: '', description: '' });
    const [addingExpense, setAddingExpense] = useState(false);

    const fetchSession = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/procurement?date=${selectedDate}`);
            const data = await res.json();
            setSession(data.session);
        } catch (error) {
            console.error('Error fetching session:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchSession();
    }, [fetchSession]);

    const generateSession = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/admin/procurement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: selectedDate })
            });
            const data = await res.json();
            if (data.session) {
                fetchSession();
            }
        } catch (error) {
            console.error('Error generating session:', error);
        } finally {
            setGenerating(false);
        }
    };

    const updateItem = async (itemId: string, updates: Partial<ProcurementItem>) => {
        try {
            await fetch(`/api/admin/procurement/items/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            fetchSession();
        } catch (error) {
            console.error('Error updating item:', error);
        }
    };

    const addExpense = async () => {
        if (!session || !newExpense.amount) return;
        setAddingExpense(true);
        try {
            await fetch('/api/admin/procurement/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: session.id,
                    ...newExpense,
                    amount: parseFloat(newExpense.amount)
                })
            });
            setNewExpense({ category: 'parkir', amount: '', description: '' });
            fetchSession();
        } catch (error) {
            console.error('Error adding expense:', error);
        } finally {
            setAddingExpense(false);
        }
    };

    const deleteExpense = async (expenseId: string) => {
        try {
            await fetch(`/api/admin/procurement/expenses/${expenseId}`, {
                method: 'DELETE'
            });
            fetchSession();
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    };

    const updateSessionStatus = async (status: string) => {
        if (!session) return;
        try {
            await fetch('/api/admin/procurement', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: session.id, status })
            });
            fetchSession();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const purchasedCount = session?.items.filter(i => i.isPurchased).length || 0;
    const totalItems = session?.items.length || 0;
    const progress = totalItems > 0 ? (purchasedCount / totalItems) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-none">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            <ShoppingCart size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Rekap Belanja</h2>
                            <p className="text-emerald-100">Kelola belanjaan harian tim procurement</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2">
                            <Calendar size={18} />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-transparent border-none text-white font-medium focus:outline-none"
                            />
                        </div>
                        <button
                            onClick={generateSession}
                            disabled={generating}
                            className="flex items-center gap-2 bg-white text-emerald-600 font-bold px-4 py-2 rounded-xl hover:bg-emerald-50 transition-all disabled:opacity-50"
                        >
                            {generating ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                            {session ? 'Refresh' : 'Generate'} Rekap
                        </button>
                    </div>
                </div>
            </Card>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-emerald-500" size={40} />
                </div>
            ) : !session ? (
                <Card className="p-12 text-center border-dashed border-2">
                    <Package className="mx-auto text-slate-300 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-slate-700 mb-2">Belum Ada Rekap</h3>
                    <p className="text-slate-500 mb-6">Klik "Generate Rekap" untuk membuat daftar belanja dari pesanan hari ini</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Items List */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Progress Bar */}
                        <Card className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-600">Progress Belanja</span>
                                <span className="text-sm font-bold text-emerald-600">{purchasedCount}/{totalItems} item</span>
                            </div>
                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </Card>

                        {/* Status Buttons */}
                        <div className="flex gap-2">
                            {['OPEN', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => updateSessionStatus(status)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${session.status === status
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {status === 'OPEN' ? '📋 Baru' : status === 'IN_PROGRESS' ? '🛒 Sedang Belanja' : '✅ Selesai'}
                                </button>
                            ))}
                        </div>

                        {/* Items Table */}
                        <Card className="overflow-hidden">
                            <div className="p-4 border-b bg-slate-50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Package size={18} />
                                    Daftar Item Belanja
                                </h3>
                            </div>
                            <div className="divide-y">
                                {session.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`p-4 flex items-center gap-4 transition-colors ${item.isPurchased ? 'bg-emerald-50' : 'hover:bg-slate-50'
                                            }`}
                                    >
                                        {/* Checkbox */}
                                        <button
                                            onClick={() => updateItem(item.id, { isPurchased: !item.isPurchased })}
                                            className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${item.isPurchased
                                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                                    : 'border-slate-300 hover:border-emerald-500'
                                                }`}
                                        >
                                            {item.isPurchased && <Check size={18} />}
                                        </button>

                                        {/* Item Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-semibold ${item.isPurchased ? 'text-emerald-700 line-through' : 'text-slate-800'}`}>
                                                {item.productName}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                <span className="font-bold text-emerald-600">{item.totalQty}</span> {item.unit}
                                            </p>
                                        </div>

                                        {/* Cost Price Input */}
                                        <div className="w-36">
                                            <input
                                                type="number"
                                                placeholder="Harga Modal"
                                                value={item.costPrice || ''}
                                                onChange={(e) => updateItem(item.id, { costPrice: e.target.value ? parseFloat(e.target.value) : null })}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                        </div>

                                        {/* Item Total */}
                                        <div className="w-28 text-right">
                                            {item.costPrice ? (
                                                <span className="font-bold text-slate-800">
                                                    {formatCurrency(item.costPrice * item.totalQty)}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-sm">-</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Right: Summary & Expenses */}
                    <div className="space-y-4">
                        {/* Summary Card */}
                        <Card className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <Receipt size={18} />
                                Ringkasan
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Modal Barang</span>
                                    <span className="font-bold">{formatCurrency(session.itemsTotal || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Pengeluaran Lain</span>
                                    <span className="font-bold">{formatCurrency(session.expensesTotal || 0)}</span>
                                </div>
                                <div className="border-t border-slate-700 pt-3">
                                    <div className="flex justify-between">
                                        <span className="font-bold text-lg">TOTAL</span>
                                        <span className="font-black text-xl text-emerald-400">
                                            {formatCurrency(session.grandTotal || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Add Expense */}
                        <Card className="p-4">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Plus size={18} />
                                Tambah Pengeluaran
                            </h3>
                            <div className="space-y-3">
                                <select
                                    value={newExpense.category}
                                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    {expenseCategories.map((cat) => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    placeholder="Jumlah (Rp)"
                                    value={newExpense.amount}
                                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                />
                                <input
                                    type="text"
                                    placeholder="Keterangan (opsional)"
                                    value={newExpense.description}
                                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                />
                                <button
                                    onClick={addExpense}
                                    disabled={!newExpense.amount || addingExpense}
                                    className="w-full py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {addingExpense ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                                    Tambah
                                </button>
                            </div>
                        </Card>

                        {/* Expenses List */}
                        {session.expenses.length > 0 && (
                            <Card className="p-4">
                                <h3 className="font-bold text-slate-800 mb-3">Pengeluaran Lain</h3>
                                <div className="space-y-2">
                                    {session.expenses.map((expense) => {
                                        const catInfo = expenseCategories.find(c => c.value === expense.category);
                                        const Icon = catInfo?.icon || CircleDollarSign;
                                        return (
                                            <div key={expense.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                                    <Icon size={16} className="text-slate-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-800">{catInfo?.label || expense.category}</p>
                                                    {expense.description && (
                                                        <p className="text-xs text-slate-500 truncate">{expense.description}</p>
                                                    )}
                                                </div>
                                                <span className="font-bold text-sm text-slate-800">{formatCurrency(Number(expense.amount))}</span>
                                                <button
                                                    onClick={() => deleteExpense(expense.id)}
                                                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        )}

                        {/* Completion Status */}
                        {session.status === 'COMPLETED' && (
                            <Card className="p-4 bg-emerald-50 border-emerald-200">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="text-emerald-600" size={24} />
                                    <div>
                                        <p className="font-bold text-emerald-800">Belanja Selesai!</p>
                                        <p className="text-sm text-emerald-600">Semua item sudah dibeli</p>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
