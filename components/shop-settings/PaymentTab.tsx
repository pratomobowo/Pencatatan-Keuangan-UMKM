'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Plus, Trash2, Loader2, QrCode } from 'lucide-react';
import { TabProps } from './types';

export const PaymentTab: React.FC<TabProps> = ({ config, setConfig }) => {
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
            <Card>
                <h3 className="text-lg font-semibold text-slate-800 mb-6">Pembayaran QRIS</h3>
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
            <Card>
                <h3 className="text-lg font-semibold text-slate-800 mb-6">Transfer Bank / E-Wallet</h3>
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
                                    className="w-full p-2 text-sm font-semibold border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Nama Bank / E-Wallet"
                                />
                                <textarea
                                    value={method.details}
                                    onChange={e => {
                                        const newP = [...config.paymentMethods];
                                        newP[idx].details = e.target.value;
                                        setConfig({ ...config, paymentMethods: newP });
                                    }}
                                    className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={2}
                                    placeholder="Nomor rekening, a/n, dll"
                                />
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, paymentMethods: config.paymentMethods.filter((_, i) => i !== idx) })}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => setConfig({ ...config, paymentMethods: [...config.paymentMethods, { name: '', details: '', icon: 'bank' }] })}
                        className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
                    >
                        <Plus size={16} /> Tambah Rekening
                    </button>
                </div>
            </Card>
        </div>
    );
};
