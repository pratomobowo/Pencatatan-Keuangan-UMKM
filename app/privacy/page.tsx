'use client';

import { ArrowLeft, Lock, Database, Eye, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center">
            <div className="w-full max-w-2xl bg-white shadow-xl min-h-screen flex flex-col relative">
                {/* Header Decoration */}
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-br from-orange-500 to-orange-600 z-0" />

                <div className="relative z-10 flex flex-col h-full">
                    {/* Sticky Header */}
                    <header className="sticky top-0 z-20 flex items-center px-4 py-3 bg-transparent backdrop-blur-sm">
                        <button
                            onClick={() => router.back()}
                            className="flex size-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="ml-4 font-bold text-white text-lg">Kebijakan Privasi</h1>
                    </header>

                    {/* Content Section */}
                    <main className="flex-1 bg-white rounded-t-[32px] mt-24 px-6 pt-10 pb-20 shadow-[0_-8px_30px_rgba(0,0,0,0.05)]">
                        <div className="flex flex-col gap-8">
                            {/* Intro */}
                            <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                <Lock className="text-orange-500 shrink-0" size={32} />
                                <p className="text-sm text-stone-700 leading-relaxed">
                                    "Keamanan data Bunda adalah prioritas kami. Di Pasarantar, kami menjaga privasi Bunda seolah menjaga privasi keluarga sendiri."
                                </p>
                            </div>

                            {/* Section 1 */}
                            <section className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 text-stone-900 font-bold">
                                    <Database className="text-orange-500" size={20} />
                                    <h2>Data yang Kami Kumpulkan</h2>
                                </div>
                                <div className="pl-7 text-sm text-stone-600 leading-relaxed flex flex-col gap-3">
                                    <p>Untuk memproses pesanan Bunda, kami mengumpulkan data terbatas berupa:</p>
                                    <ul className="list-disc flex flex-col gap-1">
                                        <li>Nama Lengkap (untuk pengiriman).</li>
                                        <li>Nomor WhatsApp (untuk verifikasi OTP & update status pesanan).</li>
                                        <li>Alamat Pengiriman (untuk tujuan antar kurir).</li>
                                        <li>Riwayat Pesanan (untuk program loyalitas Bunda).</li>
                                    </ul>
                                </div>
                            </section>

                            <hr className="border-stone-100" />

                            {/* Section 2 */}
                            <section className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 text-stone-900 font-bold">
                                    <Eye className="text-orange-500" size={20} />
                                    <h2>Bagaimana Kami Menggunakan Data</h2>
                                </div>
                                <div className="pl-7 text-sm text-stone-600 leading-relaxed flex flex-col gap-1">
                                    <p>Data Bunda **HANYA** digunakan untuk:</p>
                                    <ul className="list-disc flex flex-col gap-1 mt-2">
                                        <li>Menghubungi Bunda terkait pesanan.</li>
                                        <li>Mengirimkan produk ke alamat yang tepat.</li>
                                        <li>Memberikan informasi promo spesial khusus Bunda di Pasarantar.</li>
                                    </ul>
                                    <p className="mt-2 text-orange-600 font-medium">Kami menjamin tidak akan menyebarkan atau menjual data Bunda ke pihak manapun.</p>
                                </div>
                            </section>

                            <hr className="border-stone-100" />

                            {/* Section 3 */}
                            <section className="flex flex-col gap-3 pb-6">
                                <div className="flex items-center gap-2 text-stone-900 font-bold">
                                    <UserCheck className="text-orange-500" size={20} />
                                    <h2>Hak Bunda Over Data</h2>
                                </div>
                                <p className="pl-7 text-sm text-stone-600 leading-relaxed">
                                    Bunda berhak memperbarui alamat, mengganti password, atau meminta penghapusan akun kapan saja dengan menghubungi admin WhatsApp kami. Kami selalu siap membantu Bunda.
                                </p>
                            </section>

                            {/* Back Button Bottom */}
                            <button
                                onClick={() => router.back()}
                                className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95"
                            >
                                Kembali
                            </button>
                        </div>
                    </main>

                    {/* Footer */}
                    <footer className="py-8 text-center bg-white">
                        <p className="text-xs text-stone-400">© 2026 Pasarantar - Belanja Aman Nyaman</p>
                    </footer>
                </div>
            </div>
        </div>
    );
}
