'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Phone, Mail, MapPin } from 'lucide-react';
import { TabProps } from './types';

export const ContactLocationTab: React.FC<TabProps> = ({ config, setConfig }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Informasi Kontak</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                        <Phone size={14} className="text-emerald-500" /> WhatsApp Admin
                    </label>
                    <input
                        type="text"
                        value={config.contactInfo.whatsapp}
                        onChange={e => setConfig({ ...config, contactInfo: { ...config.contactInfo, whatsapp: e.target.value } })}
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                        placeholder="Alamat lengkap toko..."
                    />
                </div>
            </div>
        </Card>

        <Card>
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Lokasi Koordinat (untuk ongkir)</h3>
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
                            className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://maps.google.com/..."
                    />
                </div>
            </div>
        </Card>
    </div>
);
