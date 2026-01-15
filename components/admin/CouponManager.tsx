'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Plus, Trash2, Calendar, Lock, Unlock, Tag, Percent, DollarSign, Truck, AlertCircle, Loader2, X, Info as InfoIcon } from 'lucide-react';
import { useToast } from '../ui/Toast';

interface Coupon {
    id: string;
    code: string;
    description: string;
    type: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';
    value: number;
    minPurchase: number;
    maxDiscount: number;
    startDate: string;
    endDate: string;
    usageLimit: number;
    usageCount: number;
    isActive: boolean;
}

export const CouponManager: React.FC = () => {
    const toast = useToast();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        type: 'PERCENTAGE',
        value: 0,
        minPurchase: 0,
        maxDiscount: 0,
        startDate: '',
        endDate: '',
        usageLimit: 0
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const res = await fetch('/api/admin/coupons');
            if (res.ok) {
                const data = await res.json();
                setCoupons(data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat daftar kupon");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }

            toast.success("Kupon berhasil dibuat!");
            setShowModal(false);
            setFormData({
                code: '',
                description: '',
                type: 'PERCENTAGE',
                value: 0,
                minPurchase: 0,
                maxDiscount: 0,
                startDate: '',
                endDate: '',
                usageLimit: 0
            });
            fetchCoupons();
        } catch (error: any) {
            toast.error(error.message || "Gagal membuat kupon");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, code: string) => {
        if (!confirm(`Hapus kupon "${code}" permanen?`)) return;
        try {
            const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Kupon dihapus");
                fetchCoupons();
            }
        } catch (err) {
            toast.error("Gagal menghapus kupon");
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/admin/coupons/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus }),
            });
            if (res.ok) {
                fetchCoupons();
                toast.success(currentStatus ? "Kupon dinonaktifkan" : "Kupon diaktifkan");
            }
        } catch (err) {
            toast.error("Gagal update status");
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    return (
        <div className="space-y-6">
            <Card className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">Manajemen Kupon Promo</h3>
                        <p className="text-sm text-slate-500 mt-0.5">Buat kode voucher diskon atau gratis ongkir untuk pelanggan.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Buat Kupon Baru
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr className="border-b border-slate-200">
                                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Kode</th>
                                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Tipe & Nilai</th>
                                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Min. Belanja</th>
                                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Masa Berlaku</th>
                                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
                                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">
                                        <Loader2 className="animate-spin inline mr-2 text-blue-600" size={16} />
                                        Memuat data...
                                    </td>
                                </tr>
                            ) : coupons.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-16 text-center">
                                        <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                            <Tag className="text-slate-400" size={24} />
                                        </div>
                                        <p className="text-slate-500 text-sm">Belum ada kupon promo.</p>
                                    </td>
                                </tr>
                            ) : (
                                coupons.map(c => (
                                    <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-mono font-semibold text-blue-600 text-sm bg-blue-50 px-2 py-0.5 rounded w-fit">
                                                    {c.code}
                                                </span>
                                                <span className="text-xs text-slate-500 mt-1">
                                                    {c.description || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {c.type === 'PERCENTAGE' && <Percent size={14} className="text-orange-500" />}
                                                {c.type === 'FIXED' && <DollarSign size={14} className="text-emerald-500" />}
                                                {c.type === 'FREE_SHIPPING' && <Truck size={14} className="text-blue-500" />}
                                                <span className="text-sm font-medium text-slate-700">
                                                    {c.type === 'FREE_SHIPPING' ? 'Gratis Ongkir' :
                                                        c.type === 'PERCENTAGE' ? `${c.value}% OFF` :
                                                            `${formatCurrency(c.value)} OFF`}
                                                </span>
                                            </div>
                                            {Number(c.maxDiscount || 0) > 0 && (
                                                <div className="text-xs text-slate-400 mt-0.5">Maks: {formatCurrency(c.maxDiscount)}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {Number(c.minPurchase) > 0 ? formatCurrency(c.minPurchase) : 'Tanpa Min.'}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500">
                                            <div>{c.startDate ? new Date(c.startDate).toLocaleDateString('id-ID') : '∞'}</div>
                                            <div className="mx-auto w-px h-2 bg-slate-300 my-0.5"></div>
                                            <div>{c.endDate ? new Date(c.endDate).toLocaleDateString('id-ID') : '∞'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.isActive
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-slate-100 text-slate-800'
                                                }`}>
                                                {c.isActive ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center gap-1">
                                                <button
                                                    onClick={() => toggleStatus(c.id, c.isActive)}
                                                    className={`p-2 rounded-lg transition-colors ${c.isActive
                                                        ? 'text-orange-500 hover:bg-orange-50'
                                                        : 'text-emerald-500 hover:bg-emerald-50'
                                                        }`}
                                                    title={c.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                                >
                                                    {c.isActive ? <Lock size={16} /> : <Unlock size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c.id, c.code)}
                                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Hapus"
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-white">
                            <h2 className="text-lg font-semibold text-slate-800">Buat Kupon Baru</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            <div>
                                <label className="block text-sm text-slate-700 font-medium mb-1">Kode Kupon</label>
                                <input
                                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm uppercase font-mono"
                                    placeholder="CONTOH: MERDEKA45"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-700 font-medium mb-1">Deskripsi</label>
                                <input
                                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="Diskon Spesial Kemerdekaan"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-700 font-medium mb-1">Tipe Diskon</label>
                                    <select
                                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                    >
                                        <option value="PERCENTAGE">Persentase (%)</option>
                                        <option value="FIXED">Potongan Harga (Rp)</option>
                                        <option value="FREE_SHIPPING">Gratis Ongkir</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-700 font-medium mb-1">Nilai Potongan</label>
                                    <input
                                        type="number"
                                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-slate-50 disabled:text-slate-400"
                                        placeholder="10"
                                        disabled={formData.type === 'FREE_SHIPPING'}
                                        value={formData.value || ''}
                                        onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                                    />
                                    {formData.type === 'FREE_SHIPPING' && (
                                        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                            <InfoIcon size={12} />
                                            Otomatis Rp 0 ongkir
                                        </p>
                                    )}
                                </div>
                            </div>

                            {formData.type === 'PERCENTAGE' && (
                                <div>
                                    <label className="block text-sm text-slate-700 font-medium mb-1">Maksimal Diskon (Rp)</label>
                                    <input
                                        type="number"
                                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        placeholder="Contoh: 20000 (Kosongkan jika unlimited)"
                                        value={formData.maxDiscount || ''}
                                        onChange={e => setFormData({ ...formData, maxDiscount: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm text-slate-700 font-medium mb-1">Minimal Belanja (Rp)</label>
                                <input
                                    type="number"
                                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="0"
                                    value={formData.minPurchase || ''}
                                    onChange={e => setFormData({ ...formData, minPurchase: parseFloat(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-700 font-medium mb-1">Mulai Tanggal</label>
                                    <input
                                        type="date"
                                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-700 font-medium mb-1">Berakhir Tanggal</label>
                                    <input
                                        type="date"
                                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-700 font-medium mb-1">Batas Pemakaian (Kuota)</label>
                                <input
                                    type="number"
                                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="Kosongkan jika unlimited"
                                    value={formData.usageLimit || ''}
                                    onChange={e => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving && <Loader2 className="animate-spin" size={14} />}
                                Simpan Kupon
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
