'use client';

import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Save, Bell, BellOff, Smartphone, Loader2, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { useToast } from './ui/Toast';

export const NotificationSettingsManager = () => {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        adminPhone: '',
        notifyCustomer: true,
        notifyAdmin: true,
    });

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
            const response = await fetch('/api/admin/notification-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Nomor WhatsApp Admin untuk Notifikasi</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Contoh: 08123456789"
                                        value={config.adminPhone}
                                        onChange={(e) => setConfig({ ...config, adminPhone: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all text-sm"
                                    />
                                    <MessageSquare className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 italic">Nomor ini akan menerima ringkasan setiap ada pesanan masuk.</p>
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

                            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <h4 className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1">
                                    <AlertCircle size={14} /> Tips:
                                </h4>
                                <p className="text-[11px] text-blue-700 leading-relaxed">
                                    Pastikan koneksi WhatsApp Gateway (GOWA) sudah tersambung agar pesan bisa terkirim dengan lancar. Pelanggan menyukai rincian pesanan yang dikirim langsung ke WhatsApp mereka.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};
