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
                        <p className="text-lg font-semibold text-slate-800 tracking-tight">
                            {config ? `Rp ${config.pointsPerAmount.toLocaleString()} = 1 Poin` : 'Loading...'}
                        </p>
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
                        <p className="text-lg font-semibold text-slate-800 tracking-tight">Up to {config?.multiplierGold ? `${config.multiplierGold}x` : '1.5x'}</p>
                    </div>
                </Card>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-100">
                <button
                    onClick={() => setActiveTab('REWARDS')}
                    className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'REWARDS' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Hadiah
                </button>
                <button
                    onClick={() => setActiveTab('CUSTOMERS')}
                    className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'CUSTOMERS' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Pelanggan
                </button>
                <button
                    onClick={() => setActiveTab('SETTINGS')}
                    className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'SETTINGS' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Pengaturan
                </button>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'REWARDS' && (
                    <div className="space-y-6">
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
                    </div>
                )}

                {activeTab === 'CUSTOMERS' && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                <Users className="text-orange-500" size={24} />
                                Daftar Pelanggan & Poin
                            </h3>
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Cari nama, email, atau telepon..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        fetchCustomers(e.target.value);
                                    }}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                        </div>

                        <Card className="overflow-hidden border-slate-200">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100 font-bold text-xs text-slate-500 uppercase tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Pelanggan</th>
                                            <th className="px-6 py-4">Tier & Poin</th>
                                            <th className="px-6 py-4">Total Belanja</th>
                                            <th className="px-6 py-4">Order Terakhir</th>
                                            <th className="px-6 py-4 text-right">Aksi</th>
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
                                                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-900">{c.name}</div>
                                                        <div className="text-xs text-slate-500">{c.phone || c.email || '-'}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Award size={14} className={c.tier === 'GOLD' ? 'text-yellow-600' : c.tier === 'SILVER' ? 'text-slate-500' : 'text-orange-700'} />
                                                            <span className={`text-[10px] font-bold uppercase ${c.tier === 'GOLD' ? 'text-yellow-600' : c.tier === 'SILVER' ? 'text-slate-500' : 'text-orange-700'}`}>
                                                                {c.tier} Member
                                                            </span>
                                                        </div>
                                                        <div className="text-sm font-bold text-orange-600 flex items-center gap-1">
                                                            <Star className="fill-orange-500" size={14} />
                                                            {c.points} Poin
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-700">Rp {Number(c.totalSpent).toLocaleString('id-ID')}</div>
                                                        <div className="text-[10px] text-slate-500">{c.orderCount} Order</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-slate-500">
                                                        {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCustomer(c);
                                                                setShowAdjustModal(true);
                                                            }}
                                                            className="px-3 py-1.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg hover:bg-orange-100 hover:text-orange-700 transition-all"
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
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                            <Settings className="text-orange-500" size={24} />
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
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Kurs Poin Dasar (Rp)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
                                                <input
                                                    type="number"
                                                    value={config.pointsPerAmount}
                                                    onChange={(e) => setConfig({ ...config, pointsPerAmount: parseInt(e.target.value) || 0 })}
                                                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none"
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-2 italic">Jumlah belanja untuk mendapatkan 1 poin.</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Multiplier Dasar</label>
                                            <input
                                                type="number" step="0.1"
                                                value={config.pointMultiplier}
                                                onChange={(e) => setConfig({ ...config, pointMultiplier: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none"
                                            />
                                            <p className="text-[10px] text-slate-400 mt-2 italic">Multiplier poin untuk member Bronze.</p>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100">
                                        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <Award size={18} className="text-slate-500" />
                                            Konfigurasi Member Tier
                                        </h4>
                                        <div className="space-y-6">
                                            <div className="p-4 bg-slate-50 rounded-2xl space-y-4">
                                                <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    <span>Silver Tier</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-500 mb-1 block">Minimal Belanja</label>
                                                        <input
                                                            type="number"
                                                            value={config.minSpentSilver}
                                                            onChange={(e) => setConfig({ ...config, minSpentSilver: parseInt(e.target.value) || 0 })}
                                                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-500 mb-1 block">Multiplier Poin</label>
                                                        <input
                                                            type="number" step="0.1"
                                                            value={config.multiplierSilver}
                                                            onChange={(e) => setConfig({ ...config, multiplierSilver: parseFloat(e.target.value) || 0 })}
                                                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-yellow-50/50 border border-yellow-100 rounded-2xl space-y-4">
                                                <div className="flex justify-between items-center text-xs font-bold text-yellow-600 uppercase tracking-wider">
                                                    <span>Gold Tier</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-yellow-600 mb-1 block">Minimal Belanja</label>
                                                        <input
                                                            type="number"
                                                            value={config.minSpentGold}
                                                            onChange={(e) => setConfig({ ...config, minSpentGold: parseInt(e.target.value) || 0 })}
                                                            className="w-full px-3 py-2 text-sm border border-yellow-200 rounded-xl"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-yellow-600 mb-1 block">Multiplier Poin</label>
                                                        <input
                                                            type="number" step="0.1"
                                                            value={config.multiplierGold}
                                                            onChange={(e) => setConfig({ ...config, multiplierGold: parseFloat(e.target.value) || 0 })}
                                                            className="w-full px-3 py-2 text-sm border border-yellow-200 rounded-xl"
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
                                        className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                    >
                                        {savingConfig ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Atur Poin Manual</h2>
                                <p className="text-xs text-slate-500 mt-1">{selectedCustomer.name}</p>
                            </div>
                            <button onClick={() => setShowAdjustModal(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAdjustPoints} className="p-6 space-y-6">
                            <div className="p-4 bg-orange-50 rounded-2xl flex items-center justify-between">
                                <span className="text-sm font-medium text-orange-700">Poin Saat Ini:</span>
                                <span className="text-lg font-bold text-orange-800">{selectedCustomer.points} Poin</span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Jumlah Poin</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            required
                                            value={adjustData.amount}
                                            onChange={(e) => setAdjustData({ ...adjustData, amount: e.target.value })}
                                            placeholder="Contoh: 50 atau -20"
                                            className="w-full pl-4 pr-12 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            {parseInt(adjustData.amount) > 0 ? <ArrowUpRight className="text-emerald-500" /> : parseInt(adjustData.amount) < 0 ? <ArrowDownLeft className="text-rose-500" /> : <Star className="text-slate-300" />}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2">Gunakan angka negatif untuk mengurangi poin.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Keterangan / Alasan</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={adjustData.description}
                                        onChange={(e) => setAdjustData({ ...adjustData, description: e.target.value })}
                                        placeholder="Contoh: Bonus ulang tahun, Koreksi sistem, dll."
                                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 active:scale-95"
                            >
                                Konfirmasi Penyesuaian
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Form Reward (Existing) */}
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
                                            placeholder="Gratis Ikan Kembung 1kg"
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
                                className="flex-1 px-6 py-4 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 transition-all shadow-lg active:scale-95"
                            >
                                {editingReward ? 'Simpan' : 'Buat Hadiah'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
