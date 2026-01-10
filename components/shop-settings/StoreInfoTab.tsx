'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { TabProps } from './types';

export const StoreInfoTab: React.FC<TabProps> = ({ config, setConfig }) => (
    <Card>
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Informasi Toko</h3>
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Toko</label>
                <input
                    type="text"
                    value={config.storeName}
                    onChange={e => setConfig({ ...config, storeName: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nama toko Anda"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tagline</label>
                <input
                    type="text"
                    value={config.storeTagline}
                    onChange={e => setConfig({ ...config, storeTagline: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contoh: Protein Segar ke Rumah"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Toko</label>
                <textarea
                    value={config.storeDescription || ''}
                    onChange={e => setConfig({ ...config, storeDescription: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Deskripsi singkat tentang toko..."
                />
            </div>
        </div>
    </Card>
);
