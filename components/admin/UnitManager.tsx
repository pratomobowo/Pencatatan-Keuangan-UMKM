import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, RotateCcw, AlertCircle, Loader2 } from 'lucide-react';

interface Unit {
    id: string;
    name: string;
    symbol: string;
    order: number;
    isActive: boolean;
}

export const UnitManager: React.FC = () => {
    const [units, setUnits] = useState<Unit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        fetchUnits();
    }, []);

    const fetchUnits = async () => {
        try {
            const res = await fetch('/api/admin/units');
            if (res.ok) {
                const data = await res.json();
                setUnits(data);
            }
        } catch (err) {
            console.error('Failed to fetch units', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            const url = editingId ? `/api/admin/units/${editingId}` : '/api/admin/units';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, symbol }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Gagal menyimpan unit');
            }

            // Reset form
            setName('');
            setSymbol('');
            setEditingId(null);
            fetchUnits();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Yakin ingin menghapus unit "${name}"?`)) return;

        try {
            const res = await fetch(`/api/admin/units/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Gagal menghapus unit');
            fetchUnits();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleEdit = (unit: Unit) => {
        setEditingId(unit.id);
        setName(unit.name);
        setSymbol(unit.symbol);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setName('');
        setSymbol('');
    };

    const handleSeedDefaults = async () => {
        if (!confirm("Ini akan menambahkan unit standar (kg, pcs, dll). Lanjutkan?")) return;
        setIsSaving(true);
        try {
            const defaults = [
                { name: 'Kilogram', symbol: 'kg' },
                { name: 'Gram', symbol: 'gr' },
                { name: 'Ikat', symbol: 'ikat' },
                { name: 'Pack', symbol: 'pack' },
                { name: 'Pieces', symbol: 'pcs' },
                { name: 'Ekor', symbol: 'ekor' },
                { name: 'Porsi', symbol: 'porsi' },
                { name: 'Bungkus', symbol: 'bungkus' },
                { name: 'Box', symbol: 'box' },
                { name: 'Tray', symbol: 'tray' },
                { name: 'Liter', symbol: 'liter' },
                { name: 'Butir', symbol: 'butir' },
                { name: 'Sisir (Pisang)', symbol: 'sisir' },
                { name: 'Ruas (Jahe)', symbol: 'ruas' },
                { name: 'Batang (Sereh)', symbol: 'batang' },
            ];

            for (const u of defaults) {
                await fetch('/api/admin/units', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(u),
                });
            }
            fetchUnits();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Manajemen Unit</h3>
                    <p className="text-sm text-slate-500">Atur satuan produk yang tersedia di sistem</p>
                </div>
                {units.length === 0 && (
                    <button
                        onClick={handleSeedDefaults}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
                    >
                        <RotateCcw size={14} />
                        Isi Default
                    </button>
                )}
            </div>

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-sm">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <form onSubmit={handleSubmit} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nama Unit</label>
                        <input
                            type="text"
                            required
                            placeholder="Contoh: Kilogram"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    <div className="w-32">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Simbol</label>
                        <input
                            type="text"
                            required
                            placeholder="kg"
                            value={symbol}
                            onChange={e => setSymbol(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        {editingId && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-100"
                            >
                                Batal
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : (editingId ? <Check size={16} /> : <Plus size={16} />)}
                            {editingId ? 'Update' : 'Tambah'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-slate-700">Nama Unit</th>
                            <th className="px-4 py-3 font-semibold text-slate-700">Simbol</th>
                            <th className="px-4 py-3 font-semibold text-slate-700 w-24 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {isLoading ? (
                            <tr>
                                <td colSpan={3} className="p-8 text-center text-slate-400">Loading units...</td>
                            </tr>
                        ) : units.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-8 text-center text-slate-400">Belum ada unit. Silakan tambah baru atau isi default.</td>
                            </tr>
                        ) : (
                            units.map((unit) => (
                                <tr key={unit.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">{unit.name}</td>
                                    <td className="px-4 py-3 font-mono text-slate-600 bg-slate-100 rounded px-2 w-fit inline-block my-2 mx-4">{unit.symbol}</td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleEdit(unit)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(unit.id, unit.name)}
                                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
