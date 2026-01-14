'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { TabProps } from './types';
import { adminShippingMethodsAPI } from '@/lib/api';
import { ShippingMethod, ShippingType } from '@/lib/types';
import { Plus, Trash2, Power, PowerOff, Edit2, Loader2, Truck, Navigation, Store } from 'lucide-react';
import { useToast } from '../ui/Toast';

export const ShippingTab: React.FC<TabProps> = ({ config, setConfig }) => {
    const toast = useToast();
    const [methods, setMethods] = useState<ShippingMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingMethod, setEditingMethod] = useState<Partial<ShippingMethod> | null>(null);

    useEffect(() => {
        fetchMethods();
    }, []);

    const fetchMethods = async () => {
        try {
            setLoading(true);
            const data = await adminShippingMethodsAPI.getAll();
            setMethods(data);
        } catch (error) {
            console.error('Failed to fetch shipping methods:', error);
            toast.error('Gagal memuat metode pengiriman');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (method: ShippingMethod) => {
        try {
            const updated = await adminShippingMethodsAPI.update(method.id, { isActive: !method.isActive });
            setMethods(methods.map(m => m.id === method.id ? updated : m));
            toast.success(`${method.name} ${!method.isActive ? 'diaktifkan' : 'dinonaktifkan'}`);
        } catch (error) {
            toast.error('Gagal memperbarui status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus metode pengiriman ini?')) return;
        try {
            await adminShippingMethodsAPI.delete(id);
            setMethods(methods.filter(m => m.id !== id));
            toast.success('Metode pengiriman dihapus');
        } catch (error) {
            toast.error('Gagal menghapus metode');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMethod?.name || !editingMethod?.type) return;

        try {
            if (editingMethod.id) {
                const updated = await adminShippingMethodsAPI.update(editingMethod.id, editingMethod);
                setMethods(methods.map(m => m.id === editingMethod.id ? updated : m));
                toast.success('Metode pengiriman diperbarui');
            } else {
                const created = await adminShippingMethodsAPI.create(editingMethod as Omit<ShippingMethod, 'id'>);
                setMethods([...methods, created]);
                toast.success('Metode pengiriman ditambahkan');
            }
            setShowForm(false);
            setEditingMethod(null);
        } catch (error) {
            toast.error('Gagal menyimpan metode');
        }
    };

    const getIcon = (type: ShippingType) => {
        switch (type) {
            case 'DISTANCE': return <Navigation size={18} />;
            case 'PICKUP': return <Store size={18} />;
            default: return <Truck size={18} />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Shipping Methods List */}
                <Card className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Metode Pengiriman</h3>
                            <p className="text-xs text-slate-500 mt-1">Kelola cara Bunda mengirim pesanan ke pelanggan.</p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingMethod({ type: 'FLAT', isActive: true, baseFee: 0, pricePerKm: 0, minOrder: 0 });
                                setShowForm(true);
                            }}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                        >
                            <Plus size={16} />
                            Tambah Metode
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="animate-spin text-blue-600" size={32} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {methods.length === 0 ? (
                                <div className="col-span-full py-10 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                    <Truck size={40} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-slate-500 text-sm">Belum ada metode pengiriman.</p>
                                </div>
                            ) : (
                                methods.map(method => (
                                    <div
                                        key={method.id}
                                        className={`p-4 rounded-xl border transition-all ${method.isActive ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-70'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${method.isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                                                    {getIcon(method.type)}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-sm">{method.name}</h4>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{method.type}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleToggle(method)}
                                                    className={`p-2 rounded-lg transition-colors ${method.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-200'}`}
                                                    title={method.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                                >
                                                    {method.isActive ? <Power size={16} /> : <PowerOff size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingMethod(method);
                                                        setShowForm(true);
                                                    }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(method.id)}
                                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            {method.type === 'DISTANCE' && (
                                                <p className="text-xs text-slate-600">
                                                    Fee: <strong>Rp {Number(method.baseFee).toLocaleString()}</strong> + <strong>Rp {Number(method.pricePerKm).toLocaleString()}/km</strong>
                                                </p>
                                            )}
                                            {method.type === 'FLAT' && (
                                                <p className="text-xs text-slate-600">
                                                    Fee: <strong>Rp {Number(method.baseFee).toLocaleString()}</strong> (Flat)
                                                </p>
                                            )}
                                            {method.type === 'PICKUP' && (
                                                <p className="text-xs text-slate-600">Tanpa biaya (Ambil di toko)</p>
                                            )}
                                            {method.minOrder > 0 && (
                                                <p className="text-[10px] text-slate-400 italic">Min. Belanja: Rp {Number(method.minOrder).toLocaleString()}</p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </Card>

                {/* Legacy General Settings (Still in ShopConfig) */}
                <Card>
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">General Delivery Settings</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Jarak Maks Pengiriman (km)</label>
                            <input
                                type="number"
                                value={config.maxDeliveryDistance}
                                onChange={e => setConfig({ ...config, maxDeliveryDistance: parseInt(e.target.value) || 0 })}
                                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0 = tidak terbatas"
                            />
                            <p className="text-xs text-slate-400 mt-1">Isi 0 untuk tidak ada batasan jarak</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Gratis Ongkir (min. belanja Rp)</label>
                            <input
                                type="number"
                                value={config.freeShippingMinimum}
                                onChange={e => setConfig({ ...config, freeShippingMinimum: parseInt(e.target.value) || 0 })}
                                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0 = tidak ada gratis ongkir"
                            />
                        </div>
                    </div>
                </Card>

                <Card>
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Order Fees</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Minimal Order (Rp)</label>
                            <input
                                type="number"
                                value={config.minimumOrder}
                                onChange={e => setConfig({ ...config, minimumOrder: parseInt(e.target.value) || 0 })}
                                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0 = tidak ada minimum"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Biaya Layanan (Rp)</label>
                            <input
                                type="number"
                                value={config.serviceFee}
                                onChange={e => setConfig({ ...config, serviceFee: parseInt(e.target.value) || 0 })}
                                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0 = tidak ada biaya layanan"
                            />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">{editingMethod?.id ? 'Edit Metode' : 'Tambah Metode'}</h3>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Metode</label>
                                <input
                                    type="text"
                                    value={editingMethod?.name || ''}
                                    onChange={e => setEditingMethod({ ...editingMethod, name: e.target.value })}
                                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Contoh: Pasarantar Express"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipe</label>
                                <select
                                    value={editingMethod?.type || 'FLAT'}
                                    onChange={e => setEditingMethod({ ...editingMethod, type: e.target.value as ShippingType })}
                                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="DISTANCE">Berdasarkan Jarak (Km)</option>
                                    <option value="FLAT">Harga Tetap (Flat Fee)</option>
                                    <option value="PICKUP">Pickup (Ambil Sendiri)</option>
                                </select>
                            </div>

                            {editingMethod?.type !== 'PICKUP' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                            {editingMethod?.type === 'DISTANCE' ? 'Base Fee (Rp)' : 'Flat Fee (Rp)'}
                                        </label>
                                        <input
                                            type="number"
                                            value={Number(editingMethod?.baseFee) || 0}
                                            onChange={e => setEditingMethod({ ...editingMethod, baseFee: parseInt(e.target.value) || 0 })}
                                            className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    {editingMethod?.type === 'DISTANCE' && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Harga/Km (Rp)</label>
                                            <input
                                                type="number"
                                                value={Number(editingMethod?.pricePerKm) || 0}
                                                onChange={e => setEditingMethod({ ...editingMethod, pricePerKm: parseInt(e.target.value) || 0 })}
                                                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Min. Belanja (Rp)</label>
                                <input
                                    type="number"
                                    value={Number(editingMethod?.minOrder) || 0}
                                    onChange={e => setEditingMethod({ ...editingMethod, minOrder: parseInt(e.target.value) || 0 })}
                                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
