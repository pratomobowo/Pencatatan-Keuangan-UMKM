'use client';

import React, { useState, useEffect } from 'react';
import { adminShopConfigAPI } from '@/lib/api';
import { Card } from './ui/Card';
import { Save, Clock, CreditCard, HelpCircle, Phone, Store, Truck, ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from './ui/Toast';

// Import Tab Components
import {
    StoreInfoTab,
    ContactLocationTab,
    ShippingTab,
    PaymentTab,
    OperationalHoursTab,
    FaqTab,
    PopupTab,
    TabId,
    ShopConfigState,
    defaultOperationalHours
} from './shop-settings';

const tabs = [
    { id: 'store' as TabId, label: 'Toko', icon: Store },
    { id: 'contact' as TabId, label: 'Kontak', icon: Phone },
    { id: 'shipping' as TabId, label: 'Pengiriman', icon: Truck },
    { id: 'payment' as TabId, label: 'Pembayaran', icon: CreditCard },
    { id: 'hours' as TabId, label: 'Jam Operasional', icon: Clock },
    { id: 'faq' as TabId, label: 'FAQ', icon: HelpCircle },
    { id: 'popup' as TabId, label: 'Popup', icon: ImageIcon },
];

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
        popupEnabled: false,
        popupImage: null,
        popupTitle: null,
        popupLink: null,
        popupShowOnce: true,
        popupDelay: 2000,
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
                popupEnabled: data.popupEnabled || false,
                popupImage: data.popupImage || null,
                popupTitle: data.popupTitle || null,
                popupLink: data.popupLink || null,
                popupShowOnce: data.popupShowOnce !== false,
                popupDelay: data.popupDelay || 2000,
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header Card with Tabs */}
            <Card>
                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">Store Settings</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Konfigurasi informasi publik toko online.</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        <Save size={16} />
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
            </Card>

            {/* Tab Content */}
            <div>
                {activeTab === 'store' && <StoreInfoTab config={config} setConfig={setConfig} />}
                {activeTab === 'contact' && <ContactLocationTab config={config} setConfig={setConfig} />}
                {activeTab === 'shipping' && <ShippingTab config={config} setConfig={setConfig} />}
                {activeTab === 'payment' && <PaymentTab config={config} setConfig={setConfig} />}
                {activeTab === 'hours' && <OperationalHoursTab config={config} setConfig={setConfig} />}
                {activeTab === 'faq' && <FaqTab config={config} setConfig={setConfig} />}
                {activeTab === 'popup' && <PopupTab config={config} setConfig={setConfig} />}
            </div>
        </div>
    );
};
