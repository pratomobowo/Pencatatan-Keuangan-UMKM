'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ImageIcon } from 'lucide-react';
import { TabProps } from './types';

export const PopupTab: React.FC<TabProps> = ({ config, setConfig }) => {
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setConfig({ ...config, popupImage: data.url });
            } else {
                alert('Gagal upload gambar');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Gagal upload gambar');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card>
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Marketing Popup</h3>
            <div className="space-y-6">
                {/* Enable Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                        <p className="font-medium text-slate-800">Aktifkan Popup</p>
                        <p className="text-sm text-slate-500">Tampilkan popup promo saat customer buka toko</p>
                    </div>
                    <button
                        onClick={() => setConfig({ ...config, popupEnabled: !config.popupEnabled })}
                        className={`relative w-14 h-8 rounded-full transition-colors ${config.popupEnabled ? 'bg-blue-600' : 'bg-slate-300'
                            }`}
                    >
                        <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${config.popupEnabled ? 'left-7' : 'left-1'
                            }`} />
                    </button>
                </div>

                {/* Popup Image */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Gambar Popup (Poster Promo)
                    </label>
                    <div className="flex gap-4 items-start">
                        <div className="flex-shrink-0 w-40 h-48 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 overflow-hidden">
                            {config.popupImage ? (
                                <img src={config.popupImage} alt="Popup Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center text-slate-400">
                                    <ImageIcon size={32} className="mx-auto mb-2" />
                                    <p className="text-xs">Portrait 3:4</p>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <p className="text-xs text-slate-500">
                                Rekomendasi: 600x800px (3:4), format JPG/PNG, max 2MB
                            </p>
                            {config.popupImage && (
                                <button
                                    onClick={() => setConfig({ ...config, popupImage: null })}
                                    className="text-sm text-rose-500 hover:text-rose-600"
                                >
                                    Hapus Gambar
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Popup Title (Optional) */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Judul Popup (Opsional)
                    </label>
                    <input
                        type="text"
                        value={config.popupTitle || ''}
                        onChange={(e) => setConfig({ ...config, popupTitle: e.target.value || null })}
                        placeholder="Contoh: Promo Hari Ini!"
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Link (Optional) */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Link Tujuan (Opsional)
                    </label>
                    <input
                        type="url"
                        value={config.popupLink || ''}
                        onChange={(e) => setConfig({ ...config, popupLink: e.target.value || null })}
                        placeholder="https://example.com atau /products"
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        Jika diisi, popup akan bisa di-klik untuk menuju link tersebut
                    </p>
                </div>

                {/* Settings */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Delay (ms)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="500"
                            value={config.popupDelay}
                            onChange={(e) => setConfig({ ...config, popupDelay: parseInt(e.target.value) || 0 })}
                            className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Waktu tunggu sebelum popup muncul (2000 = 2 detik)
                        </p>
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                        <input
                            type="checkbox"
                            id="popupShowOnce"
                            checked={config.popupShowOnce}
                            onChange={(e) => setConfig({ ...config, popupShowOnce: e.target.checked })}
                            className="w-5 h-5 rounded border-slate-300"
                        />
                        <label htmlFor="popupShowOnce" className="text-sm text-slate-700">
                            Tampilkan 1x per sesi
                        </label>
                    </div>
                </div>

                {/* Preview Info */}
                {config.popupEnabled && config.popupImage && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <p className="text-sm text-green-700 font-medium">
                            ✓ Popup aktif dan siap ditampilkan ke pengunjung toko
                        </p>
                    </div>
                )}
            </div>
        </Card>
    );
};
