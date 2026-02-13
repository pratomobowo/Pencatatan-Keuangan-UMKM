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

            <div className="pt-4 border-t border-slate-100 mt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-semibold text-slate-800">AI Chatbot (Minsar)</h4>
                        <p className="text-xs text-slate-500">Tampilkan atau sembunyikan asisten AI di halaman depan toko.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setConfig({ ...config, aiChatEnabled: !config.aiChatEnabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${config.aiChatEnabled ? 'bg-blue-600' : 'bg-slate-200'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.aiChatEnabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>
        </div>
    </Card>
);
