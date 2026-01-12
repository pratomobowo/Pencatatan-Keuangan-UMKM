'use client';

import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Save, Link as LinkIcon, Smartphone, Key, RefreshCw, Loader2, CheckCircle2, AlertCircle, User, Lock } from 'lucide-react';
import { useToast } from './ui/Toast';

export const GowaSettingsManager = () => {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const [config, setConfig] = useState({
        endpoint: '',
        deviceId: '',
        apiKey: '',
        username: '',
        password: '',
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/gowa-config');
            if (response.ok) {
                const data = await response.json();
                setConfig({
                    endpoint: data.endpoint || '',
                    deviceId: data.deviceId || '',
                    apiKey: data.apiKey || '',
                    username: data.username || '',
                    password: data.password || '',
                });
            }
        } catch (error) {
            console.error('Failed to fetch GOWA config:', error);
            toast.error('Gagal memuat konfigurasi GOWA');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const response = await fetch('/api/admin/gowa-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            if (response.ok) {
                toast.success('Konfigurasi GOWA berhasil disimpan');
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Failed to save GOWA config:', error);
            toast.error('Gagal menyimpan konfigurasi');
        } finally {
            setSaving(false);
        }
    };

    const handleTestConnection = async () => {
        try {
            setTesting(true);
            setTestResult(null);

            const response = await fetch('/api/admin/gowa-config/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setTestResult({
                    success: true,
                    message: data.message
                });
            } else {
                throw new Error(data.error || 'Connection failed');
            }
        } catch (error: any) {
            setTestResult({
                success: false,
                message: error.message || 'Koneksi Gagal. Pastikan Endpoint dan Kredensial benar.'
            });
        } finally {
            setTesting(false);
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
                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">WhatsApp Gateway (GOWA v8)</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Konfigurasi integrasi WhatsApp untuk pengiriman OTP dan notifikasi.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleTestConnection}
                            disabled={testing || !config.endpoint}
                            className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {testing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                            Tes Koneksi
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            <Save size={16} />
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </div>

                {testResult && (
                    <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 border ${testResult.success
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                        : 'bg-rose-50 border-rose-100 text-rose-800'
                        }`}>
                        {testResult.success ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        <span className="text-sm font-medium">{testResult.message}</span>
                    </div>
                )}

                <div className="space-y-10">
                    {/* Connection Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-slate-800 font-medium pb-2 border-b border-slate-100">
                            <LinkIcon size={18} className="text-blue-500" />
                            <h3>Konfigurasi Koneksi</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Gateway URL *</label>
                                <input
                                    type="text"
                                    placeholder="https://gowa.example.com/"
                                    value={config.endpoint}
                                    onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm"
                                />
                                <p className="text-[10px] text-slate-400 mt-1 italic"> URL server GOWA Bunda.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Basic auth username"
                                            value={config.username}
                                            onChange={(e) => setConfig({ ...config, username: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm"
                                        />
                                        <User className="absolute left-3 top-2.5 text-slate-300" size={18} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            value={config.password}
                                            onChange={(e) => setConfig({ ...config, password: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm"
                                        />
                                        <Lock className="absolute left-3 top-2.5 text-slate-300" size={18} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">API Key / Bearer Token (Alternative)</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        placeholder="••••••••••••••••"
                                        value={config.apiKey}
                                        onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm"
                                    />
                                    <Key className="absolute left-3 top-2.5 text-slate-300" size={18} />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 italic">Gunakan jika tidak memakai Basic Auth (User/Pass).</p>
                            </div>
                        </div>
                    </div>

                    {/* Device Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-slate-800 font-medium pb-2 border-b border-slate-100">
                            <Smartphone size={18} className="text-emerald-500" />
                            <h3>Detail Perangkat</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Device ID (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. apple-iphone"
                                    value={config.deviceId}
                                    onChange={(e) => setConfig({ ...config, deviceId: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm"
                                />
                            </div>

                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                <h4 className="text-xs font-bold text-amber-800 mb-1">Catatan GOWA v8:</h4>
                                <ul className="text-[11px] text-amber-700 space-y-1 list-disc pl-4">
                                    <li>Pastikan format nomor internasional (contoh: 628123456789).</li>
                                    <li>Service ini akan digunakan untuk OTP Lupa Password.</li>
                                    <li>GOWA v8 biasanya mengunci akses dengan Basic Auth (User/Pass).</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};
