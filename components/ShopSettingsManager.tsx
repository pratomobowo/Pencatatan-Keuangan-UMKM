import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { adminShopConfigAPI } from '@/lib/api';
import { Save, Plus, Trash2, Clock, CreditCard, HelpCircle, Phone, Mail, MapPin } from 'lucide-react';
import { useToast } from './ui/Toast';

export const ShopSettingsManager = () => {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Settings State
    const [faq, setFaq] = useState<{ question: string, answer: string }[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<{ name: string, details: string, icon: string }[]>([]);
    const [operationalHours, setOperationalHours] = useState<any>({});
    const [contactInfo, setContactInfo] = useState({
        whatsapp: '',
        email: '',
        address: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await adminShopConfigAPI.get();
            setFaq(JSON.parse(data.faq || '[]'));
            setPaymentMethods(JSON.parse(data.paymentMethods || '[]'));
            setOperationalHours(JSON.parse(data.operationalHours || '{}'));
            setContactInfo(JSON.parse(data.contactInfo || '{}'));
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
            await adminShopConfigAPI.update({
                faq: JSON.stringify(faq),
                paymentMethods: JSON.stringify(paymentMethods),
                operationalHours: JSON.stringify(operationalHours),
                contactInfo: JSON.stringify(contactInfo)
            });
            toast.success('Pengaturan toko berhasil disimpan');
        } catch (error) {
            console.error('Failed to save shop settings:', error);
            toast.error('Gagal menyimpan pengaturan');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Memuat pengaturan...</div>;

    return (
        <div className="space-y-8 pb-12">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Contact Info */}
                <Card title="Informasi Kontak & Alamat">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                <Phone size={14} className="text-emerald-500" /> WhatsApp (Nomor Admin)
                            </label>
                            <input
                                type="text"
                                value={contactInfo.whatsapp}
                                onChange={e => setContactInfo({ ...contactInfo, whatsapp: e.target.value })}
                                className="w-full p-2.5 border rounded-lg text-sm"
                                placeholder="Misal: 08123456789 (Tanpa kode negara)"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                <Mail size={14} className="text-blue-500" /> Email Support
                            </label>
                            <input
                                type="email"
                                value={contactInfo.email}
                                onChange={e => setContactInfo({ ...contactInfo, email: e.target.value })}
                                className="w-full p-2.5 border rounded-lg text-sm"
                                placeholder="support@pasarantar.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                <MapPin size={14} className="text-rose-500" /> Alamat Fisik / Operasional
                            </label>
                            <textarea
                                value={contactInfo.address}
                                onChange={e => setContactInfo({ ...contactInfo, address: e.target.value })}
                                className="w-full p-2.5 border rounded-lg text-sm"
                                rows={3}
                                placeholder="Alamat lengkap toko/gudang..."
                            />
                        </div>
                    </div>
                </Card>

                {/* Payment Methods */}
                <Card title="Metode Pembayaran">
                    <div className="space-y-4">
                        {paymentMethods.map((method, idx) => (
                            <div key={idx} className="flex gap-2 items-start p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex-grow space-y-2">
                                    <input
                                        value={method.name}
                                        onChange={e => {
                                            const newP = [...paymentMethods];
                                            newP[idx].name = e.target.value;
                                            setPaymentMethods(newP);
                                        }}
                                        className="w-full p-2 text-sm font-bold border rounded bg-white"
                                        placeholder="Nama Bank / E-Wallet"
                                    />
                                    <textarea
                                        value={method.details}
                                        onChange={e => {
                                            const newP = [...paymentMethods];
                                            newP[idx].details = e.target.value;
                                            setPaymentMethods(newP);
                                        }}
                                        className="w-full p-2 text-xs border rounded bg-white"
                                        rows={2}
                                        placeholder="Nomor rekening, a/n, dll"
                                    />
                                </div>
                                <button
                                    onClick={() => setPaymentMethods(paymentMethods.filter((_, i) => i !== idx))}
                                    className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => setPaymentMethods([...paymentMethods, { name: '', details: '', icon: 'bank' }])}
                            className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-500 hover:bg-slate-50 flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> Tambah Rekening
                        </button>
                    </div>
                </Card>

                {/* FAQ */}
                <Card title="Pertanyaan Umum (FAQ)" className="lg:col-span-2">
                    <div className="space-y-4">
                        {faq.map((item, idx) => (
                            <div key={idx} className="flex gap-4 items-start p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex-grow space-y-2">
                                    <input
                                        value={item.question}
                                        onChange={e => {
                                            const newF = [...faq];
                                            newF[idx].question = e.target.value;
                                            setFaq(newF);
                                        }}
                                        className="w-full p-2.5 text-sm font-semibold border rounded-lg bg-white"
                                        placeholder="Pertanyaan..."
                                    />
                                    <textarea
                                        value={item.answer}
                                        onChange={e => {
                                            const newF = [...faq];
                                            newF[idx].answer = e.target.value;
                                            setFaq(newF);
                                        }}
                                        className="w-full p-2.5 text-sm border rounded-lg bg-white"
                                        rows={2}
                                        placeholder="Jawaban..."
                                    />
                                </div>
                                <button
                                    onClick={() => setFaq(faq.filter((_, i) => i !== idx))}
                                    className="p-2 text-rose-500 hover:bg-rose-100 rounded-full shrink-0"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => setFaq([...faq, { question: '', answer: '' }])}
                            className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition-all flex items-center justify-center gap-2 font-medium"
                        >
                            <Plus size={20} /> Tambah FAQ
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
};
