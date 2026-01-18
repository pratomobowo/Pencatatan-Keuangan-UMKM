'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/Card';
import { Search, Trash2 } from 'lucide-react';

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
    const [searchTerm, setSearchTerm] = useState('');

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
        if (!confirm('Hapus pengeluaran ini?')) return;
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

    const filteredItems = session?.items.filter(item =>
        item.productName.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="space-y-6">
            {/* Main Card */}
            <Card>
                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">Data Rekap Belanja</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Kelola daftar belanja harian dan harga modal.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            onClick={generateSession}
                            disabled={generating}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {generating ? 'Loading...' : session ? 'Refresh' : 'Generate'}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-16 text-center">
                        <p className="text-slate-500 text-sm">Memuat data...</p>
                    </div>
                ) : !session ? (
                    <div className="py-16 text-center">
                        <p className="text-slate-500 text-sm">Belum ada rekap untuk tanggal ini.</p>
                        <button
                            onClick={generateSession}
                            className="mt-4 text-sm text-blue-600 hover:underline"
                        >
                            Generate Rekap
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Status & Progress */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <label className="text-sm text-slate-700 font-medium">Status</label>
                                <select
                                    value={session.status}
                                    onChange={(e) => updateSessionStatus(e.target.value)}
                                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="OPEN">Baru</option>
                                    <option value="IN_PROGRESS">Sedang Belanja</option>
                                    <option value="COMPLETED">Selesai</option>
                                </select>
                            </div>
                            <div className="text-sm text-slate-600">
                                Progress: <span className="font-semibold text-slate-800">{purchasedCount}/{totalItems}</span> item
                            </div>
                        </div>

                        {/* Filter/Search Bar */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Cari produk..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Info Text */}
                        <div className="text-xs text-slate-500 mb-4">
                            Menampilkan {filteredItems.length} dari {totalItems} item
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
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
                                    {filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-12">
                                                <p className="text-slate-500 text-sm">Tidak ada item ditemukan.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item) => (
                                            <tr key={item.id} className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${item.isPurchased ? 'bg-emerald-50' : ''}`}>
                                                <td className="px-4 py-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.isPurchased}
                                                        onChange={() => updateItem(item.id, { isPurchased: !item.isPurchased })}
                                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={item.isPurchased ? 'line-through text-slate-400' : 'text-slate-900'}>
                                                        {item.productName}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="font-medium text-slate-900">{item.totalQty}</span>
                                                    <span className="text-slate-600 ml-1">{item.unit}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        placeholder="0"
                                                        value={item.costPrice || ''}
                                                        onChange={(e) => updateItem(item.id, { costPrice: e.target.value ? parseFloat(e.target.value) : null })}
                                                        className="w-full p-2.5 text-sm text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-slate-900">
                                                    {item.costPrice ? formatCurrency(item.costPrice * item.totalQty) : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </Card>

            {/* Expenses & Summary Section */}
            {session && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Expenses Card */}
                    <Card>
                        <h3 className="text-lg font-semibold text-slate-800 mb-6">Pengeluaran Tambahan</h3>

                        {/* Add Expense Form */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm text-slate-700 font-medium mb-1">Kategori</label>
                                <select
                                    value={newExpense.category}
                                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {expenseCategories.map((cat) => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-700 font-medium mb-1">Jumlah</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={newExpense.amount}
                                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm text-slate-700 font-medium mb-1">Keterangan</label>
                                <input
                                    type="text"
                                    placeholder="Opsional..."
                                    value={newExpense.description}
                                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <button
                            onClick={addExpense}
                            disabled={!newExpense.amount || addingExpense}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Tambah Pengeluaran
                        </button>

                        {/* Expenses List */}
                        {session.expenses.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-slate-200">
                                <h4 className="text-sm font-semibold text-slate-700 mb-3">Daftar Pengeluaran</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50">
                                            <tr className="border-b border-slate-200">
                                                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Kategori</th>
                                                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Keterangan</th>
                                                <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Jumlah</th>
                                                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700 w-16">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {session.expenses.map((expense) => (
                                                <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-3 text-slate-900">
                                                        {expenseCategories.find(c => c.value === expense.category)?.label || expense.category}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">
                                                        {expense.description || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                                                        {formatCurrency(Number(expense.amount))}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => deleteExpense(expense.id)}
                                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Summary Card */}
                    <Card>
                        <h3 className="text-lg font-semibold text-slate-800 mb-6">Ringkasan</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                <span className="text-sm text-slate-600">Total Modal Barang</span>
                                <span className="text-sm font-medium text-slate-900">{formatCurrency(session.itemsTotal || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                <span className="text-sm text-slate-600">Total Pengeluaran Lain</span>
                                <span className="text-sm font-medium text-slate-900">{formatCurrency(session.expensesTotal || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 bg-slate-50 -mx-6 px-6 -mb-6 rounded-b-xl">
                                <span className="text-lg font-semibold text-slate-800">GRAND TOTAL</span>
                                <span className="text-2xl font-semibold text-blue-600">{formatCurrency(session.grandTotal || 0)}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
