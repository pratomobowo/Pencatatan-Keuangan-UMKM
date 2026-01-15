'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Plus, Trash2, Calendar, Lock, Unlock, Tag, Percent, DollarSign, Truck, AlertCircle, Loader2, X } from 'lucide-react';
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
            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">Manajemen Kupon Promo</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Buat kode voucher diskon atau gratis ongkir untuk pelanggan.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm shadow-blue-200"
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
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={6} className="py-8 text-center text-slate-500"><Loader2 className="animate-spin inline mr-2" size={16} />Loading...</td></tr>
                            ) : coupons.length === 0 ? (
                                <tr><td colSpan={6} className="py-12 text-center text-slate-400">Belum ada kupon promo.</td></tr>
                            ) : (
                                coupons.map(c => (
                                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-mono font-bold text-blue-600 text-sm bg-blue-50 px-2 py-0.5 rounded w-fit">{c.code}</span>
                                                <span className="text-xs text-slate-500 mt-1">{c.description || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {c.type === 'PERCENTAGE' && <Percent size={14} className="text-orange-500" />}
                                                {c.type === 'FIXED' && <DollarSign size={14} className="text-green-500" />}
                                                {c.type === 'FREE_SHIPPING' && <Truck size={14} className="text-blue-500" />}
                                                <span className="text-sm font-medium text-slate-700">
                                                    {c.type === 'FREE_SHIPPING' ? 'Gratis Ongkir' :
                                                        c.type === 'PERCENTAGE' ? `${c.value}% OFF` :
                                                            `${formatCurrency(c.value)} OFF`}
                                                </span>
                                            </div>
                                            {Number(c.maxDiscount || 0) > 0 && (
                                                <div className="text-[10px] text-slate-400 mt-1">Max: {formatCurrency(c.maxDiscount)}</div>
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
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {c.isActive ? 'AKTIF' : 'NONAKTIF'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => toggleStatus(c.id, c.isActive)}
                                                    className={`p-1.5 rounded transition ${c.isActive ? 'text-orange-500 hover:bg-orange-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                                    title={c.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                                >
                                                    {c.isActive ? <Lock size={16} /> : <Unlock size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c.id, c.code)}
                                                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">Buat Kupon Baru</h3>
                            <button onClick={() => setShowModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Kode Kupon</label>
                                <input
                                    className="w-full p-2 border rounded-lg text-sm uppercase font-mono"
                                    placeholder="CONTOH: MERDEKA45"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi</label>
                                <input
                                    className="w-full p-2 border rounded-lg text-sm"
                                    placeholder="Diskon Spesial Kemerdekaan"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Diskon</label>
                                    <select
                                        className="w-full p-2 border rounded-lg text-sm bg-white"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                    >
                                        <option value="PERCENTAGE">Persentase (%)</option>
                                        <option value="FIXED">Potongan Harga (Rp)</option>
                                        <option value="FREE_SHIPPING">Gratis Ongkir</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Nilai Potongan</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border rounded-lg text-sm"
                                        placeholder="10"
                                        disabled={formData.type === 'FREE_SHIPPING'}
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                                    />
                                    {formData.type === 'FREE_SHIPPING' && <p className="text-[10px] text-blue-500 mt-1">Otomatis Rp 0 ongkir</p>}
                                </div>
                            </div>

                            {formData.type === 'PERCENTAGE' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Maksimal Diskon (Rp)</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border rounded-lg text-sm"
                                        placeholder="Contoh: 20000 (Kosongkan jika unlimited)"
                                        value={formData.maxDiscount || ''}
                                        onChange={e => setFormData({ ...formData, maxDiscount: parseFloat(e.target.value) })}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Minimal Belanja (Rp)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded-lg text-sm"
                                    placeholder="0"
                                    value={formData.minPurchase}
                                    onChange={e => setFormData({ ...formData, minPurchase: parseFloat(e.target.value) })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Mulai Tanggal</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 border rounded-lg text-sm"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Berakhir Tanggal</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 border rounded-lg text-sm"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Batas Pemakaian (Kuota)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded-lg text-sm"
                                    placeholder="Kosongkan jika unlimited"
                                    value={formData.usageLimit || ''}
                                    onChange={e => setFormData({ ...formData, usageLimit: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg text-sm">Batal</button>
                            <button onClick={handleSubmit} disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2">
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
