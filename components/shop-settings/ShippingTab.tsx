'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { TabProps } from './types';

export const ShippingTab: React.FC<TabProps> = ({ config, setConfig }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Kalkulasi Ongkir</h3>
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
                            className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="5000"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Harga per Km (Rp)</label>
                        <input
                            type="number"
                            value={config.pricePerKm}
                            onChange={e => setConfig({ ...config, pricePerKm: parseInt(e.target.value) || 0 })}
                            className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0 = tidak terbatas"
                    />
                    <p className="text-xs text-slate-400 mt-1">Isi 0 untuk tidak ada batasan jarak</p>
                </div>
            </div>
        </Card>

        <Card>
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Pengaturan Lainnya</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Gratis Ongkir (min. belanja Rp)</label>
                    <input
                        type="number"
                        value={config.freeShippingMinimum}
                        onChange={e => setConfig({ ...config, freeShippingMinimum: parseInt(e.target.value) || 0 })}
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
);
