'use client';

import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Save, Bell, BellOff, Smartphone, Loader2, CheckCircle2, AlertCircle, MessageSquare, Info, Plus, X } from 'lucide-react';
import { useToast } from './ui/Toast';

export const NotificationSettingsManager = () => {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        adminPhones: [] as string[],
        notifyCustomer: true,
        notifyAdmin: true,
        adminTemplate: '',
        customerTemplate: '',
    });

    const [adminPhoneInput, setAdminPhoneInput] = useState('');

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/notification-config');
            if (response.ok) {
                const data = await response.json();
                setConfig(data);
                setAdminPhoneInput(data.adminPhones?.join(', ') || '');
            }
        } catch (error) {
            console.error('Failed to fetch notification config:', error);
            toast.error('Gagal memuat konfigurasi notifikasi');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            // Process admin phones
            const phones = adminPhoneInput
                .split(',')
                .map(p => p.trim())
                .filter(p => p.length > 0);

            const payload = {
                ...config,
                adminPhones: phones,
            };

            const response = await fetch('/api/admin/notification-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                toast.success('Konfigurasi notifikasi berhasil disimpan');
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Failed to save notification config:', error);
            toast.error('Gagal menyimpan konfigurasi');
        } finally {
            setSaving(false);
        }
    };

    const placeholders = [
        { code: '{{OrderNumber}}', label: 'Nomor Pesanan' },
        { code: '{{CustomerName}}', label: 'Nama Pelanggan' },
        { code: '{{Items}}', label: 'Daftar Barang' },
        { code: '{{Total}}', label: 'Total Bayar' },
        { code: '{{Subtotal}}', label: 'Subtotal' },
        { code: '{{Ongkir}}', label: 'Biaya Ongkir' },
        { code: '{{Diskon}}', label: 'Potongan Voucher' },
        { code: '{{PaymentMethod}}', label: 'Metode Pembayaran' },
        { code: '{{ShippingMethod}}', label: 'Metode Pengiriman' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">Pengaturan Notifikasi WhatsApp</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Atur pengiriman pesan otomatis ke pelanggan dan admin.</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-100"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Admin Notification Settings */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-slate-800 font-bold pb-2 border-b border-slate-100">
                            <Smartphone size={20} className="text-orange-500" />
                            <h3>Notifikasi Admin</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <p className="text-sm font-bold text-slate-800">Aktifkan Notifikasi Admin</p>
                                    <p className="text-[10px] text-slate-500">Terima pesan saat ada order baru di website.</p>
                                </div>
                                <button
                                    onClick={() => setConfig({ ...config, notifyAdmin: !config.notifyAdmin })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${config.notifyAdmin ? 'bg-orange-500' : 'bg-slate-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.notifyAdmin ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className={`transition-all ${config.notifyAdmin ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Nomor Admin (Bisa lebih dari satu)</label>
                                <div className="relative">
                                    <textarea
                                        placeholder="Contoh: 08123456789, 08129999999"
                                        value={adminPhoneInput}
                                        onChange={(e) => setAdminPhoneInput(e.target.value)}
                                        rows={2}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all text-sm"
                                    />
                                    <MessageSquare className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 italic">Pisahkan dengan koma (,) untuk notifikasi ke banyak nomor.</p>
                            </div>

                            <div className={`transition-all ${config.notifyAdmin ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Template Pesan Admin</label>
                                <textarea
                                    value={config.adminTemplate}
                                    onChange={(e) => setConfig({ ...config, adminTemplate: e.target.value })}
                                    rows={5}
                                    placeholder="Biarkan kosong untuk menggunakan template default..."
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Customer Notification Settings */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-slate-800 font-bold pb-2 border-b border-slate-100">
                            <Bell size={20} className="text-emerald-500" />
                            <h3>Notifikasi Pelanggan</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <p className="text-sm font-bold text-slate-800">Aktifkan Notifikasi Pelanggan</p>
                                    <p className="text-[10px] text-slate-500">Kirim rincian pesanan ke WhatsApp pelanggan otomatis.</p>
                                </div>
                                <button
                                    onClick={() => setConfig({ ...config, notifyCustomer: !config.notifyCustomer })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${config.notifyCustomer ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.notifyCustomer ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className={`transition-all ${config.notifyCustomer ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Template Pesan Pelanggan</label>
                                <textarea
                                    value={config.customerTemplate}
                                    onChange={(e) => setConfig({ ...config, customerTemplate: e.target.value })}
                                    rows={10}
                                    placeholder="Biarkan kosong untuk menggunakan template default..."
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm font-mono"
                                />
                                <div className="mt-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                    <h4 className="text-[11px] font-bold text-blue-800 mb-2 flex items-center gap-1 uppercase tracking-tight">
                                        <Info size={14} /> Placeholder yang tersedia:
                                    </h4>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                        {placeholders.map(p => (
                                            <button
                                                key={p.code}
                                                onClick={() => {
                                                    // Simple append for now
                                                    setConfig({ ...config, customerTemplate: config.customerTemplate + ' ' + p.code });
                                                }}
                                                className="flex flex-col items-start hover:bg-white p-1 rounded transition-colors text-left"
                                            >
                                                <code className="text-[10px] text-blue-600 font-bold">{p.code}</code>
                                                <span className="text-[9px] text-slate-500">{p.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[9px] text-slate-400 mt-3 italic">* Klik placeholder untuk menambahkan ke template.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};
