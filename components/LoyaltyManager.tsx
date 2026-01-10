'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/Card';
import { Plus, Trash2, Edit2, X, Image as ImageIcon, Loader2, Upload, Gift, Award, Star, TrendingUp, Users } from 'lucide-react';
import { useToast } from './ui/Toast';
import Image from 'next/image';

interface LoyaltyReward {
    id: string;
    title: string;
    description: string | null;
    image: string | null;
    pointsCost: number;
    type: 'PRODUCT' | 'SHIPPING' | 'DISCOUNT';
    value: number | null;
    productId: string | null;
    isActive: boolean;
    product?: { name: string };
}

export const LoyaltyManager: React.FC = () => {
    const toast = useToast();
    const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        image: '',
        pointsCost: 10,
        type: 'DISCOUNT' as 'PRODUCT' | 'SHIPPING' | 'DISCOUNT',
        value: '',
        productId: '',
        isActive: true
    });

    useEffect(() => {
        fetchRewards();
        fetchProducts();
    }, []);

    const fetchRewards = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/loyalty/rewards');
            if (res.ok) {
                const data = await res.json();
                setRewards(data);
            }
        } catch (error) {
            console.error('Failed to fetch rewards:', error);
            toast.error('Gagal memuat katalog hadiah');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/shop/products');
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products || []);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingReward ? `/api/admin/loyalty/rewards/${editingReward.id}` : '/api/admin/loyalty/rewards';
            const method = editingReward ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success(editingReward ? 'Hadiah diperbarui' : 'Hadiah ditambahkan');
                fetchRewards();
                handleCloseModal();
            } else {
                toast.error('Gagal menyimpan hadiah');
            }
        } catch (error) {
            console.error('Failed to save reward:', error);
            toast.error('Terjadi kesalahan');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus hadiah ini dari katalog?')) return;
        try {
            const res = await fetch(`/api/admin/loyalty/rewards/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setRewards(prev => prev.filter(r => r.id !== id));
                toast.success('Hadiah dihapus');
            }
        } catch (error) {
            toast.error('Gagal menghapus hadiah');
        }
    };

    const handleEdit = (reward: LoyaltyReward) => {
        setEditingReward(reward);
        setFormData({
            title: reward.title,
            description: reward.description || '',
            image: reward.image || '',
            pointsCost: reward.pointsCost,
            type: reward.type,
            value: reward.value?.toString() || '',
            productId: reward.productId || '',
            isActive: reward.isActive
        });
        setShowFormModal(true);
    };

    const handleCloseModal = () => {
        setShowFormModal(false);
        setEditingReward(null);
        setFormData({
            title: '',
            description: '',
            image: '',
            pointsCost: 10,
            type: 'DISCOUNT',
            value: '',
            productId: '',
            isActive: true
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const uploadData = new FormData();
            uploadData.append('file', file);
            uploadData.append('folder', 'loyalty');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: uploadData,
            });

            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({ ...prev, image: data.url }));
                toast.success('Gambar berhasil diupload');
            }
        } catch (error) {
            toast.error('Gagal upload gambar');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 flex items-center gap-6 bg-blue-50/50 border-blue-100 shadow-none">
                    <div className="size-12 rounded-xl bg-blue-500 flex items-center justify-center text-white">
                        <Award size={24} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] pt-2 text-blue-600 font-medium uppercase tracking-wider">Sistem Poin</p>
                        <p className="text-lg font-semibold text-slate-800 tracking-tight">Aktif</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-6 bg-orange-50/50 border-orange-100 shadow-none">
                    <div className="size-12 rounded-xl bg-orange-500 flex items-center justify-center text-white">
                        <Star size={24} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] pt-2 text-orange-600 font-medium uppercase tracking-wider">Kurs Poin</p>
                        <p className="text-lg font-semibold text-slate-800 tracking-tight">10rb = 1 Poin</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-6 bg-emerald-50/50 border-emerald-100 shadow-none">
                    <div className="size-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                        <Gift size={24} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] pt-2  text-emerald-600 font-medium uppercase tracking-wider">Katalog Hadiah</p>
                        <p className="text-lg font-semibold text-slate-800 tracking-tight">{rewards.length} Item</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-6 bg-purple-50/50 border-purple-100 shadow-none">
                    <div className="size-12 rounded-xl bg-purple-500 flex items-center justify-center text-white">
                        <TrendingUp size={24} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] pt-2 text-purple-600 font-medium uppercase tracking-wider">Tier Multiplier</p>
                        <p className="text-lg font-semibold text-slate-800 tracking-tight">Up to 1.5x</p>
                    </div>
                </Card>
            </div>

            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Gift className="text-orange-500" size={24} />
                    <h3 className="text-xl font-bold text-slate-800">Katalog Hadiah Loyalty</h3>
                </div>
                <button
                    onClick={() => setShowFormModal(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all active:scale-95"
                >
                    <Plus size={20} />
                    Tambah Hadiah
                </button>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <Loader2 className="animate-spin text-orange-500" size={32} />
                </div>
            ) : rewards.length === 0 ? (
                <Card className="p-12 text-center">
                    <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Gift className="text-slate-300" size={40} />
                    </div>
                    <p className="text-slate-500 font-medium">Belum ada hadiah di katalog.</p>
                    <button onClick={() => setShowFormModal(true)} className="mt-4 text-orange-500 font-bold hover:underline">
                        Buat hadiah pertama sekarang
                    </button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rewards.map((reward) => (
                        <Card key={reward.id} className={`overflow-hidden group transition-all border-slate-200 hover:border-orange-200 shadow-none ${!reward.isActive ? 'opacity-60 grayscale' : ''}`}>
                            <div className="relative aspect-[16/9] bg-slate-100">
                                {reward.image ? (
                                    <Image src={reward.image} alt={reward.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-300">
                                        <ImageIcon size={48} />
                                    </div>
                                )}
                                <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur shadow-sm rounded-full flex items-center gap-1.5">
                                    <Star className="text-orange-500 fill-orange-500" size={14} />
                                    <span className="text-sm font-bold text-slate-900">{reward.pointsCost} Poin</span>
                                </div>
                                {!reward.isActive && (
                                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                                        <span className="px-4 py-2 bg-white text-slate-900 font-bold rounded-lg shadow-lg">NONAKTIF</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-900 text-lg leading-tight">{reward.title}</h4>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(reward)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(reward.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{reward.description || 'Tidak ada deskripsi.'}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
                                            ${reward.type === 'PRODUCT' ? 'bg-blue-100 text-blue-700' :
                                                reward.type === 'SHIPPING' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-purple-100 text-purple-700'}`}>
                                            {reward.type}
                                        </span>
                                        {reward.productId && reward.product && (
                                            <span className="text-[10px] font-medium text-slate-400 truncate max-w-[100px]">
                                                {reward.product.name}
                                            </span>
                                        )}
                                        {reward.value && reward.type !== 'PRODUCT' && (
                                            <span className="text-[10px] font-bold text-slate-900">
                                                Pot. Rp {Number(reward.value).toLocaleString('id-ID')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-medium italic">
                                        Voucher 30 hari
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal Form */}
            {showFormModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{editingReward ? 'Edit Hadiah' : 'Tambah Hadiah Baru'}</h2>
                                <p className="text-sm text-slate-500">Konfigurasi reward yang bisa ditukar dengan poin.</p>
                            </div>
                            <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:bg-white rounded-full transition-all shadow-sm">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Nama Hadiah <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text" required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                            placeholder="Grtis Ikan Kembung 1kg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Deskripsi</label>
                                        <textarea
                                            rows={3}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                                            placeholder="Tukarkan poinmu untuk item spesial ini..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Biaya Poin <span className="text-rose-500">*</span></label>
                                            <input
                                                type="number" required min={1}
                                                value={formData.pointsCost}
                                                onChange={(e) => setFormData({ ...formData, pointsCost: parseInt(e.target.value) || 0 })}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                                            <select
                                                value={formData.isActive ? 'TRUE' : 'FALSE'}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'TRUE' })}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                            >
                                                <option value="TRUE">Aktif</option>
                                                <option value="FALSE">Nonaktif</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Gambar</label>
                                        <input type="file" ref={imageInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                                        <div
                                            onClick={() => !isUploading && imageInputRef.current?.click()}
                                            className={`relative aspect-video border-2 border-dashed rounded-2xl cursor-pointer flex flex-col items-center justify-center bg-slate-50 overflow-hidden group
                                                ${formData.image ? 'border-orange-200' : 'border-slate-300 hover:border-orange-400'}`}
                                        >
                                            {formData.image ? (
                                                <Image src={formData.image} alt="Preview" fill className="object-cover" />
                                            ) : (
                                                <div className="text-center p-4">
                                                    {isUploading ? <Loader2 className="animate-spin mb-2 mx-auto text-orange-500" /> : <Upload className="mb-2 mx-auto text-slate-400" />}
                                                    <p className="text-xs font-bold text-slate-500 tracking-tight">Klik untuk Upload</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Tipe Hadiah</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any, productId: '', value: '' })}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                        >
                                            <option value="PRODUCT">Gratis Produk</option>
                                            <option value="SHIPPING">Gratis Ongkir</option>
                                            <option value="DISCOUNT">Potongan Diskon</option>
                                        </select>
                                    </div>
                                    {formData.type === 'PRODUCT' ? (
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Pilih Produk <span className="text-rose-500">*</span></label>
                                            <select
                                                required
                                                value={formData.productId}
                                                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                            >
                                                <option value="">Pilih Produk...</option>
                                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Nilai Potongan (Rp) <span className="text-rose-500">*</span></label>
                                            <input
                                                type="number" required
                                                value={formData.value}
                                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                                placeholder="Contoh: 15000"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>

                        <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-4">
                            <button type="button" onClick={handleCloseModal} className="flex-1 px-6 py-4 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-white transition-all shadow-sm">
                                Batal
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-1 px-6 py-4 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
                            >
                                {editingReward ? 'Simpan Perubahan' : 'Buat Hadiah'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
