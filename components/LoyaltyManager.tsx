'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/Card';
import {
    Plus, Trash2, Edit2, X, Image as ImageIcon, Loader2,
    Upload, Gift, Award, Star, TrendingUp, Users, Settings,
    Search, ArrowUpRight, ArrowDownLeft, Save
} from 'lucide-react';
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

interface LoyaltyConfig {
    pointsPerAmount: number;
    pointMultiplier: number;
    minSpentSilver: number;
    minSpentGold: number;
    multiplierSilver: number;
    multiplierGold: number;
}

interface LoyaltyCustomer {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    points: number;
    tier: string;
    totalSpent: number;
    orderCount: number;
    lastOrderDate: string | null;
}

export const LoyaltyManager: React.FC = () => {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<'REWARDS' | 'CUSTOMERS' | 'SETTINGS'>('REWARDS');

    // Rewards State
    const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Config State
    const [config, setConfig] = useState<LoyaltyConfig | null>(null);
    const [savingConfig, setSavingConfig] = useState(false);

    // Customers State
    const [customers, setCustomers] = useState<LoyaltyCustomer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<LoyaltyCustomer | null>(null);
    const [adjustData, setAdjustData] = useState({ amount: '', description: '', type: 'ADJUSTED' as any });

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
        fetchConfig();
    }, []);

    useEffect(() => {
        if (activeTab === 'CUSTOMERS') {
            fetchCustomers();
        }
    }, [activeTab]);

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

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/admin/loyalty/config');
            if (res.ok) {
                const data = await res.json();
                setConfig({
                    pointsPerAmount: Number(data.pointsPerAmount),
                    pointMultiplier: Number(data.pointMultiplier),
                    minSpentSilver: Number(data.minSpentSilver),
                    minSpentGold: Number(data.minSpentGold),
                    multiplierSilver: Number(data.multiplierSilver),
                    multiplierGold: Number(data.multiplierGold),
                });
            }
        } catch (error) {
            console.error('Failed to fetch config:', error);
        }
    };

    const fetchCustomers = async (query = searchQuery) => {
        try {
            setLoadingCustomers(true);
            const res = await fetch(`/api/admin/loyalty/customers?q=${query}`);
            if (res.ok) {
                setCustomers(await res.json());
            }
        } catch (error) {
            toast.error('Gagal memuat daftar pelanggan');
        } finally {
            setLoadingCustomers(false);
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

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!config) return;
        setSavingConfig(true);
        try {
            const res = await fetch('/api/admin/loyalty/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });
            if (res.ok) {
                toast.success('Konfigurasi loyalty disimpan');
            } else {
                toast.error('Gagal menyimpan konfigurasi');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        } finally {
            setSavingConfig(false);
        }
    };

    const handleAdjustPoints = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer) return;
        try {
            const res = await fetch('/api/admin/loyalty/adjust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: selectedCustomer.id,
                    amount: parseInt(adjustData.amount),
                    description: adjustData.description,
                    type: adjustData.type
                }),
            });
            if (res.ok) {
                toast.success('Poin berhasil disesuaikan');
                setShowAdjustModal(false);
                fetchCustomers();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Gagal menyesuaikan poin');
            }
        } catch (error) {
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
            {/* Action Bar */}
            <Card className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">Program Loyalitas Customer</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Kelola sistem poin, katalog hadiah, dan pantau loyalitas pelanggan Anda.</p>
                    </div>
                </div>
            </Card>

            {/* Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 flex items-center gap-4 bg-blue-50/50 border-blue-100 shadow-none">
                    <div className="size-10 rounded-lg bg-blue-500 flex items-center justify-center text-white shrink-0">
                        <Award size={20} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider truncate">Sistem Poin</p>
                        <p className="text-base font-semibold text-slate-800 tracking-tight">Aktif</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4 bg-orange-50/50 border-orange-100 shadow-none">
                    <div className="size-10 rounded-lg bg-orange-500 flex items-center justify-center text-white shrink-0">
                        <Star size={20} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] text-orange-600 font-semibold uppercase tracking-wider truncate">Kurs Poin</p>
                        <p className="text-base font-semibold text-slate-800 tracking-tight truncate">
                            {config ? `Rp ${config.pointsPerAmount.toLocaleString()} = 1 Poin` : 'Loading...'}
                        </p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4 bg-emerald-50/50 border-emerald-100 shadow-none">
                    <div className="size-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0">
                        <Gift size={20} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider truncate">Katalog Hadiah</p>
                        <p className="text-base font-semibold text-slate-800 tracking-tight">{rewards.length} Item</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4 bg-purple-50/50 border-purple-100 shadow-none">
                    <div className="size-10 rounded-lg bg-purple-500 flex items-center justify-center text-white shrink-0">
                        <TrendingUp size={20} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] text-purple-600 font-semibold uppercase tracking-wider truncate">Tier Multiplier</p>
                        <p className="text-base font-semibold text-slate-800 tracking-tight truncate">Up to {config?.multiplierGold ? `${config.multiplierGold}x` : '1.5x'}</p>
                    </div>
                </Card>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('REWARDS')}
                    className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 -mb-px ${activeTab === 'REWARDS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Katalog Hadiah
                </button>
                <button
                    onClick={() => setActiveTab('CUSTOMERS')}
                    className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 -mb-px ${activeTab === 'CUSTOMERS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Daftar Pelanggan
                </button>
                <button
                    onClick={() => setActiveTab('SETTINGS')}
                    className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 -mb-px ${activeTab === 'SETTINGS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Pengaturan
                </button>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'REWARDS' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-3">
                                <Gift className="text-orange-500" size={20} />
                                <h3 className="text-base font-semibold text-slate-800">Katalog Hadiah Loyalty</h3>
                            </div>
                            <button
                                onClick={() => setShowFormModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all text-sm shadow-sm"
                            >
                                <Plus size={16} />
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
                                                    <ImageIcon size={32} />
                                                </div>
                                            )}
                                            <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur shadow-sm rounded-lg flex items-center gap-1.5 border border-white/50">
                                                <Star className="text-orange-500 fill-orange-500" size={12} />
                                                <span className="text-xs font-semibold text-slate-900">{reward.pointsCost} Poin</span>
                                            </div>
                                            {!reward.isActive && (
                                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                                                    <span className="px-3 py-1 bg-slate-900/90 text-white text-[10px] font-semibold rounded-full shadow-lg letter tracking-wider">NONAKTIF</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-1.5 gap-2">
                                                <h4 className="font-semibold text-slate-900 text-sm leading-tight line-clamp-1">{reward.title}</h4>
                                                <div className="flex gap-1 shrink-0">
                                                    <button onClick={() => handleEdit(reward)} className="p-1 px-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => handleDelete(reward.id)} className="p-1 px-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-slate-500 line-clamp-2 mb-4 h-8 leading-relaxed">{reward.description || 'Tidak ada deskripsi.'}</p>

                                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider
                                                        ${reward.type === 'PRODUCT' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                            reward.type === 'SHIPPING' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                                'bg-purple-50 text-purple-700 border border-purple-100'}`}>
                                                        {reward.type}
                                                    </span>
                                                    {reward.productId && reward.product && (
                                                        <span className="text-[10px] font-medium text-slate-400 truncate max-w-[80px]">
                                                            {reward.product.name}
                                                        </span>
                                                    )}
                                                    {reward.value && reward.type !== 'PRODUCT' && (
                                                        <span className="text-[10px] font-semibold text-slate-900">
                                                            Pot. Rp {Number(reward.value).toLocaleString('id-ID')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[9px] text-slate-400 italic">
                                                    Voucher 30 hari
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'CUSTOMERS' && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg border border-slate-200">
                            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-3">
                                <Users className="text-blue-600" size={20} />
                                Daftar Pelanggan & Poin
                            </h3>
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Cari nama, email, atau telepon..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        fetchCustomers(e.target.value);
                                    }}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                                />
                            </div>
                        </div>

                        <Card className="overflow-hidden border-slate-200">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-[10px] text-slate-500 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-3">Pelanggan</th>
                                            <th className="px-6 py-3">Tier & Poin</th>
                                            <th className="px-6 py-3">Total Belanja</th>
                                            <th className="px-6 py-3">Order Terakhir</th>
                                            <th className="px-6 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {loadingCustomers ? (
                                            <tr>
                                                <td colSpan={5} className="py-20 text-center">
                                                    <Loader2 className="animate-spin text-orange-500 mx-auto" size={32} />
                                                </td>
                                            </tr>
                                        ) : customers.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-20 text-center text-slate-400">
                                                    Tidak ada data pelanggan.
                                                </td>
                                            </tr>
                                        ) : (
                                            customers.map((c) => (
                                                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                                                    <td className="px-6 py-3">
                                                        <div className="font-semibold text-slate-900 text-sm">{c.name}</div>
                                                        <div className="text-[10px] text-slate-500">{c.phone || c.email || '-'}</div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Award size={12} className={c.tier === 'GOLD' ? 'text-yellow-600' : c.tier === 'SILVER' ? 'text-slate-500' : 'text-slate-400'} />
                                                            <span className={`text-[10px] font-semibold uppercase ${c.tier === 'GOLD' ? 'text-yellow-600' : c.tier === 'SILVER' ? 'text-slate-500' : 'text-slate-400'}`}>
                                                                {c.tier} Member
                                                            </span>
                                                        </div>
                                                        <div className="text-xs font-semibold text-orange-600 flex items-center gap-1">
                                                            <Star className="fill-orange-500" size={12} />
                                                            {c.points} Poin
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="font-semibold text-slate-700 text-xs">Rp {Number(c.totalSpent).toLocaleString('id-ID')}</div>
                                                        <div className="text-[10px] text-slate-500">{c.orderCount} Order</div>
                                                    </td>
                                                    <td className="px-6 py-3 text-[10px] text-slate-500">
                                                        {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCustomer(c);
                                                                setShowAdjustModal(true);
                                                            }}
                                                            className="px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-slate-200"
                                                        >
                                                            Atur Poin
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'SETTINGS' && (
                    <div className="max-w-2xl">
                        <h3 className="text-base font-semibold text-slate-800 mb-6 flex items-center gap-3">
                            <Settings className="text-blue-600" size={20} />
                            Pengaturan Sistem Loyalty
                        </h3>

                        {!config ? (
                            <div className="h-64 flex items-center justify-center">
                                <Loader2 className="animate-spin text-orange-500" size={32} />
                            </div>
                        ) : (
                            <form onSubmit={handleSaveConfig} className="space-y-8">
                                <Card className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Kurs Poin Dasar (Rp)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">Rp</span>
                                                <input
                                                    type="number"
                                                    value={config.pointsPerAmount}
                                                    onChange={(e) => setConfig({ ...config, pointsPerAmount: parseInt(e.target.value) || 0 })}
                                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-2 font-medium italic">Jumlah belanja untuk mendapatkan 1 poin.</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Multiplier Dasar</label>
                                            <input
                                                type="number" step="0.1"
                                                value={config.pointMultiplier}
                                                onChange={(e) => setConfig({ ...config, pointMultiplier: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                                            />
                                            <p className="text-[10px] text-slate-500 mt-2 font-medium italic">Multiplier poin untuk member Bronze.</p>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-200">
                                        <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                            <Award size={16} className="text-blue-500" />
                                            Konfigurasi Member Tier
                                        </h4>
                                        <div className="space-y-6">
                                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                                                <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 uppercase tracking-widest bg-white/50 w-fit px-2 py-0.5 rounded border border-slate-100">
                                                    <span>Silver Tier</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-semibold text-slate-500 mb-1.5 block uppercase">Minimal Belanja</label>
                                                        <input
                                                            type="number"
                                                            value={config.minSpentSilver}
                                                            onChange={(e) => setConfig({ ...config, minSpentSilver: parseInt(e.target.value) || 0 })}
                                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-semibold text-slate-500 mb-1.5 block uppercase">Multiplier Poin</label>
                                                        <input
                                                            type="number" step="0.1"
                                                            value={config.multiplierSilver}
                                                            onChange={(e) => setConfig({ ...config, multiplierSilver: parseFloat(e.target.value) || 0 })}
                                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-yellow-50/50 border border-yellow-100 rounded-lg space-y-4 shadow-sm shadow-yellow-100/50">
                                                <div className="flex justify-between items-center text-[10px] font-semibold text-yellow-600 uppercase tracking-widest bg-white/80 w-fit px-2 py-0.5 rounded border border-yellow-200/50">
                                                    <span>Gold Tier</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-semibold text-yellow-600 mb-1.5 block uppercase">Minimal Belanja</label>
                                                        <input
                                                            type="number"
                                                            value={config.minSpentGold}
                                                            onChange={(e) => setConfig({ ...config, minSpentGold: parseInt(e.target.value) || 0 })}
                                                            className="w-full px-3 py-2 text-sm border border-yellow-200 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-semibold text-yellow-600 mb-1.5 block uppercase">Multiplier Poin</label>
                                                        <input
                                                            type="number" step="0.1"
                                                            value={config.multiplierGold}
                                                            onChange={(e) => setConfig({ ...config, multiplierGold: parseFloat(e.target.value) || 0 })}
                                                            className="w-full px-3 py-2 text-sm border border-yellow-200 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={savingConfig}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 text-sm"
                                    >
                                        {savingConfig ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                        Simpan Pengaturan
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Adjustment Poin */}
            {showAdjustModal && selectedCustomer && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200 border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-base font-semibold text-slate-800">Atur Poin Manual</h2>
                                <p className="text-[10px] text-slate-500 mt-0.5">Penyesuaian saldo poin untuk {selectedCustomer.name}</p>
                            </div>
                            <button onClick={() => setShowAdjustModal(false)} className="p-1.5 text-slate-400 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAdjustPoints} className="p-6 space-y-6">
                            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg flex items-center justify-between">
                                <span className="text-xs font-semibold text-blue-700">Poin Saat Ini:</span>
                                <span className="text-base font-semibold text-blue-800">{selectedCustomer.points} Poin</span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Jumlah Poin</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            required
                                            value={adjustData.amount}
                                            onChange={(e) => setAdjustData({ ...adjustData, amount: e.target.value })}
                                            placeholder="Contoh: 50 atau -20"
                                            className="w-full pl-4 pr-12 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all shadow-sm"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            {parseInt(adjustData.amount) > 0 ? <ArrowUpRight size={18} className="text-emerald-500" /> : parseInt(adjustData.amount) < 0 ? <ArrowDownLeft size={18} className="text-rose-500" /> : <Star size={18} className="text-slate-300" />}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2 font-medium italic">Gunakan angka negatif untuk mengurangi poin.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Keterangan / Alasan</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={adjustData.description}
                                        onChange={(e) => setAdjustData({ ...adjustData, description: e.target.value })}
                                        placeholder="Contoh: Bonus ulang tahun, Koreksi sistem, dll."
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAdjustModal(false)}
                                    className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-all text-sm shadow-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm text-sm active:scale-[0.98]"
                                >
                                    Konfirmasi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Form Reward (Existing) */}
            {showFormModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h2 className="text-base font-semibold text-slate-800">{editingReward ? 'Edit Hadiah' : 'Tambah Hadiah Baru'}</h2>
                                <p className="text-[10px] text-slate-500 mt-0.5">Konfigurasi reward yang bisa ditukar dengan poin.</p>
                            </div>
                            <button onClick={handleCloseModal} className="p-1.5 text-slate-400 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Nama Hadiah <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text" required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm shadow-sm"
                                            placeholder="Gratis Ikan Kembung 1kg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Deskripsi</label>
                                        <textarea
                                            rows={3}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-sm shadow-sm"
                                            placeholder="Tukarkan poinmu untuk item spesial ini..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Biaya Poin <span className="text-rose-500">*</span></label>
                                            <input
                                                type="number" required min={1}
                                                value={formData.pointsCost}
                                                onChange={(e) => setFormData({ ...formData, pointsCost: parseInt(e.target.value) || 0 })}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm shadow-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Status</label>
                                            <select
                                                value={formData.isActive ? 'TRUE' : 'FALSE'}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'TRUE' })}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm shadow-sm"
                                            >
                                                <option value="TRUE">Aktif</option>
                                                <option value="FALSE">Nonaktif</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Gambar</label>
                                        <input type="file" ref={imageInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                                        <div
                                            onClick={() => !isUploading && imageInputRef.current?.click()}
                                            className={`relative aspect-video border-2 border-dashed rounded-lg cursor-pointer flex flex-col items-center justify-center bg-slate-50 transition-all group overflow-hidden shadow-sm
                                                ${formData.image ? 'border-blue-200' : 'border-slate-300 hover:border-blue-400'}`}
                                        >
                                            {formData.image ? (
                                                <>
                                                    <Image src={formData.image} alt="Preview" fill className="object-cover" />
                                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <div className="bg-white/90 p-2 rounded-lg flex items-center gap-2 text-slate-800 text-[10px] font-semibold">
                                                            <Upload size={14} />
                                                            Ganti Gambar
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center p-4">
                                                    {isUploading ? <Loader2 className="animate-spin mb-2 mx-auto text-blue-500" /> : <Upload className="mb-2 mx-auto text-slate-400" size={24} />}
                                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Klik untuk Upload</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Tipe Hadiah</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any, productId: '', value: '' })}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm shadow-sm"
                                        >
                                            <option value="PRODUCT">Gratis Produk</option>
                                            <option value="SHIPPING">Gratis Ongkir</option>
                                            <option value="DISCOUNT">Potongan Diskon</option>
                                        </select>
                                    </div>
                                    {formData.type === 'PRODUCT' ? (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Pilih Produk <span className="text-rose-500">*</span></label>
                                            <select
                                                required
                                                value={formData.productId}
                                                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm shadow-sm"
                                            >
                                                <option value="">Pilih Produk...</option>
                                                {products.map(p => <option key={p.id} value={p.id} className="text-xs">{p.name}</option>)}
                                            </select>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">Nilai Potongan (Rp) <span className="text-rose-500">*</span></label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">Rp</span>
                                                <input
                                                    type="number" required
                                                    value={formData.value}
                                                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm shadow-sm"
                                                    placeholder="Contoh: 15000"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>

                        <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3">
                            <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-white transition-all text-sm shadow-sm">
                                Batal
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm active:scale-[0.98] text-sm"
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
