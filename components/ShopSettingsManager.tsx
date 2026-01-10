'use client';

import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { adminShopConfigAPI } from '@/lib/api';
import {
    Save, Plus, Trash2, Clock, CreditCard, HelpCircle, Phone, Mail, MapPin,
    Store, Truck, Settings2, Loader2, Navigation, DollarSign, Package, ImageIcon, QrCode
} from 'lucide-react';
import { useToast } from './ui/Toast';

type TabId = 'store' | 'contact' | 'shipping' | 'payment' | 'hours' | 'faq';

interface ShopConfigState {
    // Store Info (Tab 1)
    storeName: string;
    storeTagline: string;
    storeLogo: string | null;
    storeDescription: string | null;

    // Contact & Location (Tab 2)
    contactInfo: {
        whatsapp: string;
        email: string;
        address: string;
    };
    storeLatitude: number | null;
    storeLongitude: number | null;
    googleMapsUrl: string | null;

    // Shipping (Tab 3)
    pricePerKm: number;
    baseShippingFee: number;
    maxDeliveryDistance: number;
    freeShippingMinimum: number;
    minimumOrder: number;
    serviceFee: number;

    // Payment (Tab 4)
    paymentMethods: { name: string; details: string; icon: string }[];
    qrisImage: string | null;

    // Operational Hours (Tab 5)
    operationalHours: Record<string, { open: string; close: string; isOpen: boolean }>;
    holidayMode: boolean;
    holidayMessage: string | null;

    // FAQ (Tab 6)
    faq: { question: string; answer: string }[];
}

const defaultOperationalHours = {
    monday: { open: '08:00', close: '17:00', isOpen: true },
    tuesday: { open: '08:00', close: '17:00', isOpen: true },
    wednesday: { open: '08:00', close: '17:00', isOpen: true },
    thursday: { open: '08:00', close: '17:00', isOpen: true },
    friday: { open: '08:00', close: '17:00', isOpen: true },
    saturday: { open: '08:00', close: '15:00', isOpen: true },
    sunday: { open: '', close: '', isOpen: false },
};

const dayNames: Record<string, string> = {
    monday: 'Senin',
    tuesday: 'Selasa',
    wednesday: 'Rabu',
    thursday: 'Kamis',
    friday: 'Jumat',
    saturday: 'Sabtu',
    sunday: 'Minggu',
};

export const ShopSettingsManager = () => {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>('store');

    const [config, setConfig] = useState<ShopConfigState>({
        storeName: 'Pasarantar',
        storeTagline: 'Protein Segar ke Rumah',
        storeLogo: null,
        storeDescription: null,
        contactInfo: { whatsapp: '', email: '', address: '' },
        storeLatitude: null,
        storeLongitude: null,
        googleMapsUrl: null,
        pricePerKm: 2000,
        baseShippingFee: 5000,
        maxDeliveryDistance: 0,
        freeShippingMinimum: 0,
        minimumOrder: 0,
        serviceFee: 0,
        paymentMethods: [],
        qrisImage: null,
        operationalHours: defaultOperationalHours,
        holidayMode: false,
        holidayMessage: null,
        faq: [],
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await adminShopConfigAPI.get();
            setConfig({
                storeName: data.storeName || 'Pasarantar',
                storeTagline: data.storeTagline || '',
                storeLogo: data.storeLogo,
                storeDescription: data.storeDescription,
                contactInfo: data.contactInfo || { whatsapp: '', email: '', address: '' },
                storeLatitude: data.storeLatitude,
                storeLongitude: data.storeLongitude,
                googleMapsUrl: data.googleMapsUrl,
                pricePerKm: data.pricePerKm || 2000,
                baseShippingFee: data.baseShippingFee || 5000,
                maxDeliveryDistance: data.maxDeliveryDistance || 0,
                freeShippingMinimum: data.freeShippingMinimum || 0,
                minimumOrder: data.minimumOrder || 0,
                serviceFee: data.serviceFee || 0,
                paymentMethods: data.paymentMethods || [],
                qrisImage: data.qrisImage || null,
                operationalHours: data.operationalHours && Object.keys(data.operationalHours).length > 0
                    ? data.operationalHours
                    : defaultOperationalHours,
                holidayMode: data.holidayMode || false,
                holidayMessage: data.holidayMessage,
                faq: data.faq || [],
            });
        } catch (error) {
            console.error('Failed to fetch shop settings:', error);
            toast.error('Gagal memuat pengaturan');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await adminShopConfigAPI.update(config);
            toast.success('Pengaturan toko berhasil disimpan');
        } catch (error) {
            console.error('Failed to save shop settings:', error);
            toast.error('Gagal menyimpan pengaturan');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'store' as TabId, label: 'Toko', icon: Store },
        { id: 'contact' as TabId, label: 'Kontak', icon: Phone },
        { id: 'shipping' as TabId, label: 'Pengiriman', icon: Truck },
        { id: 'payment' as TabId, label: 'Pembayaran', icon: CreditCard },
        { id: 'hours' as TabId, label: 'Jam Operasional', icon: Clock },
        { id: 'faq' as TabId, label: 'FAQ', icon: HelpCircle },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header with Save Button */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">Store Settings</h2>
                    <p className="text-sm text-slate-500">Konfigurasi informasi publik toko online.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 shadow-md font-medium disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? 'Menyimpan...' : 'Simpan Semua'}
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                            ${activeTab === tab.id
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'store' && (
                    <StoreInfoTab config={config} setConfig={setConfig} />
                )}
                {activeTab === 'contact' && (
                    <ContactLocationTab config={config} setConfig={setConfig} />
                )}
                {activeTab === 'shipping' && (
                    <ShippingTab config={config} setConfig={setConfig} />
                )}
                {activeTab === 'payment' && (
                    <PaymentTab config={config} setConfig={setConfig} />
                )}
                {activeTab === 'hours' && (
                    <OperationalHoursTab config={config} setConfig={setConfig} />
                )}
                {activeTab === 'faq' && (
                    <FaqTab config={config} setConfig={setConfig} />
                )}
            </div>
        </div>
    );
};

// Tab 1: Store Info
const StoreInfoTab = ({ config, setConfig }: { config: ShopConfigState; setConfig: React.Dispatch<React.SetStateAction<ShopConfigState>> }) => (
    <Card title="Informasi Toko">
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Toko</label>
                <input
                    type="text"
                    value={config.storeName}
                    onChange={e => setConfig({ ...config, storeName: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm"
                    placeholder="Nama toko Anda"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tagline</label>
                <input
                    type="text"
                    value={config.storeTagline}
                    onChange={e => setConfig({ ...config, storeTagline: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm"
                    placeholder="Contoh: Protein Segar ke Rumah"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Toko</label>
                <textarea
                    value={config.storeDescription || ''}
                    onChange={e => setConfig({ ...config, storeDescription: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm"
                    rows={3}
                    placeholder="Deskripsi singkat tentang toko..."
                />
            </div>
        </div>
    </Card>
);

// Tab 2: Contact & Location
const ContactLocationTab = ({ config, setConfig }: { config: ShopConfigState; setConfig: React.Dispatch<React.SetStateAction<ShopConfigState>> }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Informasi Kontak">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                        <Phone size={14} className="text-emerald-500" /> WhatsApp Admin
                    </label>
                    <input
                        type="text"
                        value={config.contactInfo.whatsapp}
                        onChange={e => setConfig({ ...config, contactInfo: { ...config.contactInfo, whatsapp: e.target.value } })}
                        className="w-full p-2.5 border rounded-lg text-sm"
                        placeholder="08123456789"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                        <Mail size={14} className="text-blue-500" /> Email Support
                    </label>
                    <input
                        type="email"
                        value={config.contactInfo.email}
                        onChange={e => setConfig({ ...config, contactInfo: { ...config.contactInfo, email: e.target.value } })}
                        className="w-full p-2.5 border rounded-lg text-sm"
                        placeholder="support@pasarantar.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                        <MapPin size={14} className="text-rose-500" /> Alamat Toko
                    </label>
                    <textarea
                        value={config.contactInfo.address}
                        onChange={e => setConfig({ ...config, contactInfo: { ...config.contactInfo, address: e.target.value } })}
                        className="w-full p-2.5 border rounded-lg text-sm"
                        rows={2}
                        placeholder="Alamat lengkap toko..."
                    />
                </div>
            </div>
        </Card>

        <Card title="Lokasi Koordinat (untuk ongkir)">
            <div className="space-y-4">
                <p className="text-xs text-slate-500 bg-blue-50 p-3 rounded-lg">
                    💡 Koordinat diperlukan untuk menghitung ongkir otomatis berdasarkan jarak.
                    Dapatkan dari Google Maps dengan klik kanan lokasi toko.
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                        <input
                            type="number"
                            step="0.00000001"
                            value={config.storeLatitude || ''}
                            onChange={e => setConfig({ ...config, storeLatitude: e.target.value ? parseFloat(e.target.value) : null })}
                            className="w-full p-2.5 border rounded-lg text-sm"
                            placeholder="-6.2088"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                        <input
                            type="number"
                            step="0.00000001"
                            value={config.storeLongitude || ''}
                            onChange={e => setConfig({ ...config, storeLongitude: e.target.value ? parseFloat(e.target.value) : null })}
                            className="w-full p-2.5 border rounded-lg text-sm"
                            placeholder="106.8456"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Link Google Maps (opsional)</label>
                    <input
                        type="url"
                        value={config.googleMapsUrl || ''}
                        onChange={e => setConfig({ ...config, googleMapsUrl: e.target.value })}
                        className="w-full p-2.5 border rounded-lg text-sm"
                        placeholder="https://maps.google.com/..."
                    />
                </div>
            </div>
        </Card>
    </div>
);

// Tab 3: Shipping
const ShippingTab = ({ config, setConfig }: { config: ShopConfigState; setConfig: React.Dispatch<React.SetStateAction<ShopConfigState>> }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Kalkulasi Ongkir">
            <div className="space-y-4">
                <p className="text-xs text-slate-500 bg-emerald-50 p-3 rounded-lg">
                    🚚 Ongkir dihitung otomatis: <strong>Base Fee + (Jarak × Harga/km)</strong>
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Base Fee (Rp)</label>
                        <input
                            type="number"
                            value={config.baseShippingFee}
                            onChange={e => setConfig({ ...config, baseShippingFee: parseInt(e.target.value) || 0 })}
                            className="w-full p-2.5 border rounded-lg text-sm"
                            placeholder="5000"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Harga per Km (Rp)</label>
                        <input
                            type="number"
                            value={config.pricePerKm}
                            onChange={e => setConfig({ ...config, pricePerKm: parseInt(e.target.value) || 0 })}
                            className="w-full p-2.5 border rounded-lg text-sm"
                            placeholder="2000"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Jarak Maks Pengiriman (km)</label>
                    <input
                        type="number"
                        value={config.maxDeliveryDistance}
                        onChange={e => setConfig({ ...config, maxDeliveryDistance: parseInt(e.target.value) || 0 })}
                        className="w-full p-2.5 border rounded-lg text-sm"
                        placeholder="0 = tidak terbatas"
                    />
                    <p className="text-xs text-slate-400 mt-1">Isi 0 untuk tidak ada batasan jarak</p>
                </div>
            </div>
        </Card>

        <Card title="Pengaturan Lainnya">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Gratis Ongkir (min. belanja Rp)</label>
                    <input
                        type="number"
                        value={config.freeShippingMinimum}
                        onChange={e => setConfig({ ...config, freeShippingMinimum: parseInt(e.target.value) || 0 })}
                        className="w-full p-2.5 border rounded-lg text-sm"
                        placeholder="0 = tidak ada gratis ongkir"
                    />
                    <p className="text-xs text-slate-400 mt-1">Isi 0 untuk menonaktifkan</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Minimal Order (Rp)</label>
                    <input
                        type="number"
                        value={config.minimumOrder}
                        onChange={e => setConfig({ ...config, minimumOrder: parseInt(e.target.value) || 0 })}
                        className="w-full p-2.5 border rounded-lg text-sm"
                        placeholder="0 = tidak ada minimum"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Biaya Layanan (Rp)</label>
                    <input
                        type="number"
                        value={config.serviceFee}
                        onChange={e => setConfig({ ...config, serviceFee: parseInt(e.target.value) || 0 })}
                        className="w-full p-2.5 border rounded-lg text-sm"
                        placeholder="0 = tidak ada biaya layanan"
                    />
                </div>
            </div>
        </Card>
    </div>
);

// Tab 4: Payment Methods
const PaymentTab = ({ config, setConfig }: { config: ShopConfigState; setConfig: React.Dispatch<React.SetStateAction<ShopConfigState>> }) => {
    const [uploadingQris, setUploadingQris] = React.useState(false);

    const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingQris(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'qris');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            setConfig({ ...config, qrisImage: data.url });
        } catch (error) {
            console.error('QRIS upload error:', error);
            alert('Gagal mengupload gambar QRIS');
        } finally {
            setUploadingQris(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* QRIS Section */}
            <Card title="Pembayaran QRIS">
                <div className="space-y-4">
                    <p className="text-xs text-slate-500 bg-blue-50 p-3 rounded-lg">
                        Upload gambar QR Code QRIS Anda. Pelanggan akan melihat QR ini saat memilih pembayaran QRIS di checkout.
                    </p>

                    {config.qrisImage ? (
                        <div className="relative group">
                            <img
                                src={config.qrisImage}
                                alt="QRIS Code"
                                className="w-full max-w-[280px] mx-auto rounded-xl border-2 border-slate-200 shadow-sm"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                                <label className="cursor-pointer bg-white text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-100">
                                    Ganti
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleQrisUpload}
                                        className="hidden"
                                    />
                                </label>
                                <button
                                    onClick={() => setConfig({ ...config, qrisImage: null })}
                                    className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-rose-600"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                            {uploadingQris ? (
                                <Loader2 className="animate-spin text-blue-500" size={32} />
                            ) : (
                                <>
                                    <QrCode size={40} className="text-slate-400 mb-2" />
                                    <span className="text-sm text-slate-500 font-medium">Upload Gambar QRIS</span>
                                    <span className="text-xs text-slate-400 mt-1">Format: JPG, PNG (maks 2MB)</span>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleQrisUpload}
                                className="hidden"
                                disabled={uploadingQris}
                            />
                        </label>
                    )}
                </div>
            </Card>

            {/* Bank Transfer Section */}
            <Card title="Transfer Bank / E-Wallet">
                <div className="space-y-4">
                    {config.paymentMethods.map((method, idx) => (
                        <div key={idx} className="flex gap-2 items-start p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex-grow space-y-2">
                                <input
                                    value={method.name}
                                    onChange={e => {
                                        const newP = [...config.paymentMethods];
                                        newP[idx].name = e.target.value;
                                        setConfig({ ...config, paymentMethods: newP });
                                    }}
                                    className="w-full p-2 text-sm font-bold border rounded bg-white"
                                    placeholder="Nama Bank / E-Wallet"
                                />
                                <textarea
                                    value={method.details}
                                    onChange={e => {
                                        const newP = [...config.paymentMethods];
                                        newP[idx].details = e.target.value;
                                        setConfig({ ...config, paymentMethods: newP });
                                    }}
                                    className="w-full p-2 text-xs border rounded bg-white"
                                    rows={2}
                                    placeholder="Nomor rekening, a/n, dll"
                                />
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, paymentMethods: config.paymentMethods.filter((_, i) => i !== idx) })}
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => setConfig({ ...config, paymentMethods: [...config.paymentMethods, { name: '', details: '', icon: 'bank' }] })}
                        className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-500 hover:bg-slate-50 flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> Tambah Rekening
                    </button>
                </div>
            </Card>
        </div>
    );
};

// Tab 5: Operational Hours
const OperationalHoursTab = ({ config, setConfig }: { config: ShopConfigState; setConfig: React.Dispatch<React.SetStateAction<ShopConfigState>> }) => (
    <div className="space-y-6">
        <Card title="Mode Libur">
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-medium text-slate-800">Toko Sedang Libur</p>
                    <p className="text-xs text-slate-500">Aktifkan jika toko tutup sementara</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={config.holidayMode}
                        onChange={e => setConfig({ ...config, holidayMode: e.target.checked })}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>
            {config.holidayMode && (
                <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pesan Libur</label>
                    <input
                        type="text"
                        value={config.holidayMessage || ''}
                        onChange={e => setConfig({ ...config, holidayMessage: e.target.value })}
                        className="w-full p-2.5 border rounded-lg text-sm"
                        placeholder="Toko tutup untuk libur lebaran..."
                    />
                </div>
            )}
        </Card>

        <Card title="Jam Operasional">
            <div className="space-y-3">
                {Object.entries(config.operationalHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-4 py-2 border-b border-slate-100 last:border-0">
                        <div className="w-24">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hours.isOpen}
                                    onChange={e => {
                                        const newHours = { ...config.operationalHours };
                                        newHours[day] = { ...hours, isOpen: e.target.checked };
                                        setConfig({ ...config, operationalHours: newHours });
                                    }}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm font-medium">{dayNames[day] || day}</span>
                            </label>
                        </div>
                        {hours.isOpen ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="time"
                                    value={hours.open}
                                    onChange={e => {
                                        const newHours = { ...config.operationalHours };
                                        newHours[day] = { ...hours, open: e.target.value };
                                        setConfig({ ...config, operationalHours: newHours });
                                    }}
                                    className="p-1.5 border rounded text-sm"
                                />
                                <span className="text-slate-400">-</span>
                                <input
                                    type="time"
                                    value={hours.close}
                                    onChange={e => {
                                        const newHours = { ...config.operationalHours };
                                        newHours[day] = { ...hours, close: e.target.value };
                                        setConfig({ ...config, operationalHours: newHours });
                                    }}
                                    className="p-1.5 border rounded text-sm"
                                />
                            </div>
                        ) : (
                            <span className="text-sm text-slate-400">Tutup</span>
                        )}
                    </div>
                ))}
            </div>
        </Card>
    </div>
);

// Tab 6: FAQ
const FaqTab = ({ config, setConfig }: { config: ShopConfigState; setConfig: React.Dispatch<React.SetStateAction<ShopConfigState>> }) => (
    <Card title="Pertanyaan Umum (FAQ)">
        <div className="space-y-4">
            {config.faq.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-start p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex-grow space-y-2">
                        <input
                            value={item.question}
                            onChange={e => {
                                const newF = [...config.faq];
                                newF[idx].question = e.target.value;
                                setConfig({ ...config, faq: newF });
                            }}
                            className="w-full p-2.5 text-sm font-semibold border rounded-lg bg-white"
                            placeholder="Pertanyaan..."
                        />
                        <textarea
                            value={item.answer}
                            onChange={e => {
                                const newF = [...config.faq];
                                newF[idx].answer = e.target.value;
                                setConfig({ ...config, faq: newF });
                            }}
                            className="w-full p-2.5 text-sm border rounded-lg bg-white"
                            rows={2}
                            placeholder="Jawaban..."
                        />
                    </div>
                    <button
                        onClick={() => setConfig({ ...config, faq: config.faq.filter((_, i) => i !== idx) })}
                        className="p-2 text-rose-500 hover:bg-rose-100 rounded-full shrink-0"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ))}
            <button
                onClick={() => setConfig({ ...config, faq: [...config.faq, { question: '', answer: '' }] })}
                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition-all flex items-center justify-center gap-2 font-medium"
            >
                <Plus size={20} /> Tambah FAQ
            </button>
        </div>
    </Card>
);
