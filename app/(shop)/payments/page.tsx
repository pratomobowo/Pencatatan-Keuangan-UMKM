'use client';

import Link from 'next/link';
import { ChevronLeft, CreditCard, Banknote, Wallet, Info } from 'lucide-react';

export default function PaymentsPage() {
    const paymentMethods = [
        {
            id: 'cod',
            title: 'Cash on Delivery (COD)',
            description: 'Bayar tunai di tempat saat pesanan tiba.',
            icon: Banknote,
            active: true
        },
        {
            id: 'transfer',
            title: 'Transfer Bank (Segera Hadir)',
            description: 'BCA, Mandiri, BRI, dan bank lainnya.',
            icon: CreditCard,
            active: false
        },
        {
            id: 'ewallet',
            title: 'E-Wallet (Segera Hadir)',
            description: 'GoPay, ShopeePay, OVO, Dana.',
            icon: Wallet,
            active: false
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pb-24 text-stone-900">
            <header className="bg-white border-b sticky top-0 z-20 px-4 py-3 flex items-center gap-4">
                <Link href="/account" className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                    <ChevronLeft size={24} className="text-gray-700" />
                </Link>
                <h1 className="text-lg font-bold">Metode Pembayaran</h1>
            </header>

            <main className="flex-1 p-4">
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-6 flex gap-4">
                    <div className="size-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                        <Info size={20} className="text-orange-600" />
                    </div>
                    <p className="text-sm text-orange-900 leading-relaxed">
                        Saat ini kami hanya mendukung pembayaran <strong>Tunai di Tempat (COD)</strong> untuk menjamin keamanan transaksi Anda.
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    {paymentMethods.map((method) => (
                        <div
                            key={method.id}
                            className={`bg-white p-5 rounded-2xl shadow-sm border transition-all ${method.active ? 'border-orange-500 ring-2 ring-orange-50' : 'border-gray-100 opacity-60'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`size-12 rounded-xl flex items-center justify-center ${method.active ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <method.icon size={28} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold">{method.title}</h3>
                                    <p className="text-xs text-gray-500 mt-1">{method.description}</p>
                                </div>
                                {method.active && (
                                    <div className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                                        AKTIF
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
