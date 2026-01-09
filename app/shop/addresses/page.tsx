'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, MapPin, Edit2, Trash2, Check, Home, Building2, Loader2 } from 'lucide-react';
import { useShopAuth } from '@/contexts/ShopAuthContext';

interface Address {
    id: string;
    label: string;
    name: string;
    phone: string;
    address: string;
    isDefault: boolean;
    type: 'home' | 'office';
}

export default function AddressesPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useShopAuth();

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        label: '',
        name: '',
        phone: '',
        address: '',
        type: 'home' as 'home' | 'office',
    });

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/shop/login');
            return;
        }

        if (isAuthenticated) {
            fetchAddresses();
        }
    }, [isAuthenticated, authLoading]);

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/shop/customers/me/addresses');
            if (response.ok) {
                const data = await response.json();
                setAddresses(data);
            }
        } catch (err) {
            console.error('Error fetching addresses:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            const response = await fetch(`/api/shop/customers/me/addresses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isDefault: true }),
            });

            if (response.ok) {
                fetchAddresses();
            }
        } catch (err) {
            console.error('Error setting default:', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus alamat ini?')) return;

        try {
            const response = await fetch(`/api/shop/customers/me/addresses/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setAddresses(addresses.filter(addr => addr.id !== id));
            }
        } catch (err) {
            console.error('Error deleting address:', err);
        }
    };

    const handleEdit = (addr: Address) => {
        setEditingId(addr.id);
        setFormData({
            label: addr.label,
            name: addr.name,
            phone: addr.phone,
            address: addr.address,
            type: addr.type,
        });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (editingId) {
                // Update existing
                const response = await fetch(`/api/shop/customers/me/addresses/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                if (response.ok) {
                    fetchAddresses();
                }
            } else {
                // Add new
                const response = await fetch('/api/shop/customers/me/addresses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                if (response.ok) {
                    fetchAddresses();
                }
            }

            setShowForm(false);
            setEditingId(null);
            setFormData({ label: '', name: '', phone: '', address: '', type: 'home' });
        } catch (err) {
            console.error('Error saving address:', err);
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-orange-500" size={40} />
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm">
                <div className="flex items-center px-4 py-3 justify-between">
                    <Link href="/shop/account" className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-orange-50">
                        <ArrowLeft size={24} />
                    </Link>
                    <h2 className="text-stone-900 text-lg font-bold flex-1 text-center">Alamat Pengiriman</h2>
                    <button
                        onClick={() => {
                            setShowForm(true);
                            setEditingId(null);
                            setFormData({ label: '', name: '', phone: '', address: '', type: 'home' });
                        }}
                        className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-orange-50 text-orange-500"
                    >
                        <Plus size={24} />
                    </button>
                </div>
            </header>

            <main className="p-4 pb-24 flex flex-col gap-4">
                {/* Address List */}
                {addresses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <MapPin size={64} className="text-gray-300 mb-4" />
                        <p className="text-gray-500 mb-2">Belum ada alamat</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="text-orange-500 font-bold"
                        >
                            Tambah Alamat
                        </button>
                    </div>
                ) : (
                    addresses.map((addr) => (
                        <div
                            key={addr.id}
                            className={`bg-white rounded-2xl shadow-sm border-2 p-4 transition-all ${addr.isDefault ? 'border-orange-500' : 'border-orange-50'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`size-10 rounded-full shrink-0 flex items-center justify-center ${addr.type === 'home' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    {addr.type === 'home' ? <Home size={20} /> : <Building2 size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-stone-900">{addr.label}</p>
                                        {addr.isDefault && (
                                            <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-medium rounded-full">
                                                Utama
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-stone-900 mt-1">{addr.name}</p>
                                    <p className="text-sm text-gray-500">{addr.phone}</p>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{addr.address}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                                {!addr.isDefault && (
                                    <button
                                        onClick={() => handleSetDefault(addr.id)}
                                        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                    >
                                        <Check size={16} />
                                        Jadikan Utama
                                    </button>
                                )}
                                <div className="flex-1"></div>
                                <button
                                    onClick={() => handleEdit(addr)}
                                    className="flex items-center justify-center size-9 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(addr.id)}
                                    className="flex items-center justify-center size-9 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </main>

            {/* Add/Edit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
                    <div className="w-full max-w-md mx-auto bg-white rounded-t-3xl p-6 pb-8 animate-slide-up">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-stone-900">
                                {editingId ? 'Edit Alamat' : 'Tambah Alamat'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingId(null);
                                }}
                                className="text-gray-500"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {/* Type Selector */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'home' })}
                                    className={`flex-1 py-3 rounded-xl border-2 font-medium transition-all ${formData.type === 'home'
                                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                                            : 'border-gray-200 text-gray-500'
                                        }`}
                                >
                                    🏠 Rumah
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'office' })}
                                    className={`flex-1 py-3 rounded-xl border-2 font-medium transition-all ${formData.type === 'office'
                                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                                            : 'border-gray-200 text-gray-500'
                                        }`}
                                >
                                    🏢 Kantor
                                </button>
                            </div>

                            <input
                                type="text"
                                placeholder="Label (contoh: Rumah Ibu)"
                                value={formData.label}
                                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Nama Penerima"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500"
                                required
                            />
                            <input
                                type="tel"
                                placeholder="Nomor HP"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500"
                                required
                            />
                            <textarea
                                placeholder="Alamat Lengkap"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500 resize-none"
                                required
                            />

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    editingId ? 'Simpan Perubahan' : 'Tambah Alamat'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
