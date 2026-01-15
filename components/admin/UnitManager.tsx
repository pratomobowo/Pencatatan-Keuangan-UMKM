import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Plus, Edit2, Trash2, Check, X, RotateCcw, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '../ui/Toast';

interface Unit {
    id: string;
    name: string;
    symbol: string;
    order: number;
    isActive: boolean;
}

export const UnitManager: React.FC = () => {
    // Hooks
    const toast = useToast();

    // Data State
    const [units, setUnits] = useState<Unit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // UI State
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form Field State
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');

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
            toast.error("Gagal memuat data unit");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (unit?: Unit) => {
        if (unit) {
            setEditingId(unit.id);
            setName(unit.name);
            setSymbol(unit.symbol);
        } else {
            setEditingId(null);
            setName('');
            setSymbol('');
        }
        setShowFormModal(true);
    };

    const handleCloseModal = () => {
        setShowFormModal(false);
        setEditingId(null);
        setName('');
        setSymbol('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

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

            toast.success(editingId ? "Unit berhasil diperbarui" : "Unit berhasil ditambahkan");
            handleCloseModal();
            fetchUnits();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Yakin ingin menghapus unit "${name}"?`)) return;

        try {
            const res = await fetch(`/api/admin/units/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Gagal menghapus unit');

            toast.success("Unit berhasil dihapus");
            fetchUnits();
        } catch (err: any) {
            toast.error(err.message);
        }
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
            toast.success("Unit standar berhasil ditambahkan");
            fetchUnits();
        } catch (err) {
            console.error(err);
            toast.error("Gagal menambahkan unit default");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">Manajemen Unit</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Atur satuan produk yang tersedia di sistem (misal: kg, pack, ikat).</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Seed Button (Only show if empty or specific condition, but kept available for convenience) */}
                        {units.length === 0 && (
                            <button
                                onClick={handleSeedDefaults}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                            >
                                <RotateCcw size={14} />
                                {isSaving ? 'Seeding...' : 'Isi Default'}
                            </button>
                        )}

                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm shadow-blue-200"
                        >
                            <Plus size={16} />
                            Tambah Unit
                        </button>
                    </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr className="border-b border-slate-200">
                                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Nama Unit</th>
                                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Simbol / Singkatan</th>
                                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700 w-32">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={3} className="py-8 text-center text-slate-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 size={16} className="animate-spin" />
                                            Memuat data...
                                        </div>
                                    </td>
                                </tr>
                            ) : units.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="py-12 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                                            <AlertCircle size={32} />
                                            <p className="text-sm">Belum ada unit terdaftar.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                units.map((unit) => (
                                    <tr key={unit.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-4 py-3 text-sm text-slate-700 font-medium">
                                            {unit.name}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 font-mono border border-slate-200">
                                                {unit.symbol}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenModal(unit)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit Unit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(unit.id, unit.name)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Hapus Unit"
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
            </Card>

            {/* Modal Form */}
            {showFormModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    {editingId ? 'Edit Unit' : 'Tambah Unit Baru'}
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {editingId ? 'Perbarui informasi unit ini.' : 'Tambahkan satuan baru ke sistem.'}
                                </p>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Nama Unit <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                        placeholder="Contoh: Kilogram"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">Nama lengkap satuan (misal: Kilogram, Bungkus).</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Simbol / Singkatan <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={symbol}
                                        onChange={(e) => setSymbol(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-mono"
                                        placeholder="Contoh: kg"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">Singkatan yang akan tampil di kartu produk (misal: kg, bks).</p>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-5 py-2.5 border border-slate-300 text-slate-600 text-sm font-semibold rounded-lg hover:bg-white hover:border-slate-400 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
                                >
                                    {isSaving && <Loader2 size={16} className="animate-spin" />}
                                    {editingId ? 'Simpan Perubahan' : 'Buat Unit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
