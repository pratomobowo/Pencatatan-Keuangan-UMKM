'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronDown, ChevronUp, MessageCircle, Phone, Mail, HelpCircle, Search } from 'lucide-react';

export default function HelpPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        fetch('/api/admin/shop-config')
            .then(res => res.json())
            .then(data => {
                setSettings({
                    faq: JSON.parse(data.faq || '[]'),
                    contact: JSON.parse(data.contactInfo || '{}')
                });
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const defaultFaqs = [
        {
            q: "Kapan pesanan saya akan dikirim?",
            a: "Pesanan Anda akan dikirim setiap harinya pada jam operasional kami (07:00 - 17:00). Estimasi waktu pengiriman adalah 1-2 jam setelah pesanan dikonfirmasi."
        },
        {
            q: "Bagaimana cara melakukan pembayaran?",
            a: "Saat ini kami mendukung metode Cash on Delivery (COD). Anda dapat membayar tunai langsung kepada kurir kami saat barang sampai di tempat Anda."
        }
    ];

    const displayFaqs = settings?.faq?.length > 0 ? settings.faq.map((f: any) => ({ q: f.question, a: f.answer })) : defaultFaqs;
    const waNumber = settings?.contact?.whatsapp || '6281234567890';

    return (
        <div className="min-h-screen bg-white flex flex-col pb-24 text-stone-900">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 py-4 flex items-center border-b border-stone-100">
                <Link href="/account" className="size-8 flex items-center justify-center rounded-lg bg-stone-50 text-stone-600 hover:bg-stone-100 transition-colors">
                    <ChevronLeft size={20} />
                </Link>
                <h1 className="flex-1 text-center mr-8 text-base font-bold text-stone-800">Pusat Bantuan</h1>
            </header>

            <main className="flex-1 flex flex-col">
                {/* Hero Section */}
                <div className="p-4 pt-6">
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-[2rem] p-8 text-white shadow-xl shadow-orange-100 relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold mb-3 leading-tight">Ada yang bisa <br />kami bantu?</h2>
                            <p className="text-orange-50 text-sm leading-relaxed max-w-[200px]">
                                {loading ? 'Memuat informasi...' : 'Temukan jawaban cepat atau hubungi tim kami.'}
                            </p>
                        </div>
                        <div className="absolute -bottom-6 -right-6 opacity-20 transform rotate-12">
                            <HelpCircle size={160} />
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <section className="px-4 py-6">
                    <div className="flex items-center justify-between mb-5 px-1">
                        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-[0.1em]">Pertanyaan Populer</h3>
                        <div className="size-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-400">
                            <Search size={16} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {displayFaqs.map((faq: any, index: number) => (
                            <div
                                key={index}
                                className={`group rounded-2xl border transition-all duration-300 ${openFaq === index
                                    ? 'border-orange-200 bg-orange-50/30'
                                    : 'border-stone-100 bg-white hover:border-orange-100'
                                    }`}
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                    className="w-full px-5 py-4 flex items-center justify-between text-left"
                                >
                                    <span className={`font-semibold text-sm transition-colors ${openFaq === index ? 'text-orange-600' : 'text-stone-700'
                                        }`}>
                                        {faq.q}
                                    </span>
                                    <div className={`transition-transform duration-300 ${openFaq === index ? 'rotate-180 text-orange-500' : 'text-stone-300'}`}>
                                        <ChevronDown size={18} />
                                    </div>
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                                    }`}>
                                    <div className="px-5 pb-5 text-sm text-stone-500 leading-relaxed font-medium">
                                        {faq.a}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Contact Section */}
                <section className="px-4 py-4 mb-4">
                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-[0.1em] mb-4 px-1">Hubungi Kami</h3>
                    <div className="flex flex-col">
                        <a
                            href={`https://wa.me/${waNumber.startsWith('0') ? '62' + waNumber.slice(1) : waNumber}`}
                            target="_blank"
                            className="bg-white p-6 rounded-[1.5rem] border border-stone-100 shadow-sm flex items-center justify-between hover:border-orange-500 hover:shadow-orange-50 transition-all active:scale-95 group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="size-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 group-hover:bg-green-500 group-hover:text-white transition-all">
                                    <MessageCircle size={28} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm text-stone-800 tracking-wide">WhatsApp</span>
                                    <span className="text-xs text-stone-400">Respon cepat via WhatsApp</span>
                                </div>
                            </div>
                            <div className="size-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-300">
                                <ChevronDown size={18} className="-rotate-90" />
                            </div>
                        </a>
                    </div>
                </section>

                {/* Support Info */}
                <div className="px-4 pb-8">
                    <div className="bg-stone-50 p-5 rounded-[1.5rem] flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                            <Phone size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-0.5">Jam Operasional</p>
                            <p className="text-sm font-bold text-stone-700 leading-none">Senin - Minggu</p>
                            <p className="text-xs text-stone-500 mt-1">
                                {settings?.contact?.operationalHours || '07:00 - 17:00 WIB'}
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
