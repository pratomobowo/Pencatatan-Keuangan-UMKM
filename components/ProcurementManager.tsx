'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/Card';

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
    { value: 'parkir', label: 'Parkir' },
    { value: 'kopi', label: 'Kopi/Makan' },
    { value: 'bensin', label: 'Bensin' },
    { value: 'lainnya', label: 'Lainnya' }
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

    return (
        <div className="space-y-6">
            {/* Main Card */}
            <Card>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">Rekap Belanja Harian</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Kelola daftar belanja dan pengeluaran tim procurement.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            onClick={generateSession}
                            disabled={generating}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            {generating ? 'Loading...' : session ? 'Refresh Rekap' : 'Generate Rekap'}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-slate-500">Memuat data...</div>
                ) : !session ? (
                    <div className="text-center py-12">
                        <p className="text-slate-500 mb-2">Belum ada rekap untuk tanggal ini</p>
                        <p className="text-xs text-slate-400">Klik "Generate Rekap" untuk membuat daftar belanja dari pesanan</p>
                    </div>
                ) : (
                    <>
                        {/* Status & Progress */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600">Status:</span>
                                <select
                                    value={session.status}
                                    onChange={(e) => updateSessionStatus(e.target.value)}
                                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="OPEN">Baru</option>
                                    <option value="IN_PROGRESS">Sedang Belanja</option>
                                    <option value="COMPLETED">Selesai</option>
                                </select>
                            </div>
                            <div className="text-sm text-slate-600">
                                Progress: <span className="font-semibold text-blue-600">{purchasedCount}/{totalItems}</span> item dibeli
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="overflow-x-auto mb-6">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr className="border-b border-slate-200">
                                        <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700 w-16">Beli</th>
                                        <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Produk</th>
                                        <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700 w-24">Qty</th>
                                        <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700 w-36">Harga Modal</th>
                                        <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700 w-32">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {session.items.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-8 text-slate-500">
                                                Tidak ada item untuk dibelanjakan
                                            </td>
                                        </tr>
                                    ) : (
                                        session.items.map((item) => (
                                            <tr key={item.id} className={`border-b border-slate-100 ${item.isPurchased ? 'bg-green-50' : 'hover:bg-slate-50/50'}`}>
                                                <td className="px-4 py-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.isPurchased}
                                                        onChange={() => updateItem(item.id, { isPurchased: !item.isPurchased })}
                                                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={item.isPurchased ? 'line-through text-slate-400' : 'text-slate-800'}>
                                                        {item.productName}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="font-medium text-slate-800">{item.totalQty}</span>
                                                    <span className="text-slate-500 ml-1">{item.unit}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        placeholder="0"
                                                        value={item.costPrice || ''}
                                                        onChange={(e) => updateItem(item.id, { costPrice: e.target.value ? parseFloat(e.target.value) : null })}
                                                        className="w-full px-2 py-1.5 text-sm text-right border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-slate-800">
                                                    {item.costPrice ? formatCurrency(item.costPrice * item.totalQty) : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer with Summary and Expenses */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                            {/* Expenses Section */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-700 mb-3">Pengeluaran Tambahan</h4>

                                {/* Add Expense Form */}
                                <div className="flex gap-2 mb-3">
                                    <select
                                        value={newExpense.category}
                                        onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-32"
                                    >
                                        {expenseCategories.map((cat) => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="Jumlah"
                                        value={newExpense.amount}
                                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-28"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Keterangan"
                                        value={newExpense.description}
                                        onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={addExpense}
                                        disabled={!newExpense.amount || addingExpense}
                                        className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium disabled:opacity-50"
                                    >
                                        Tambah
                                    </button>
                                </div>

                                {/* Expenses List */}
                                {session.expenses.length > 0 && (
                                    <div className="space-y-2">
                                        {session.expenses.map((expense) => (
                                            <div key={expense.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm">
                                                <div>
                                                    <span className="font-medium text-slate-700">
                                                        {expenseCategories.find(c => c.value === expense.category)?.label || expense.category}
                                                    </span>
                                                    {expense.description && (
                                                        <span className="text-slate-500 ml-2">- {expense.description}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-medium text-slate-800">{formatCurrency(Number(expense.amount))}</span>
                                                    <button
                                                        onClick={() => deleteExpense(expense.id)}
                                                        className="text-red-500 hover:text-red-700 text-xs"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Summary Section */}
                            <div className="bg-slate-50 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-slate-700 mb-3">Ringkasan</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Total Modal Barang</span>
                                        <span className="font-medium text-slate-800">{formatCurrency(session.itemsTotal || 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Total Pengeluaran Lain</span>
                                        <span className="font-medium text-slate-800">{formatCurrency(session.expensesTotal || 0)}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-slate-200">
                                        <span className="font-semibold text-slate-800">GRAND TOTAL</span>
                                        <span className="font-bold text-blue-600">{formatCurrency(session.grandTotal || 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}
