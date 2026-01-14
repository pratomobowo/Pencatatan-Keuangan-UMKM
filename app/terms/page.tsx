'use client';

import { ArrowLeft, ScrollText, ShieldCheck, Scale, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TermsPage() {
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
                        <h1 className="ml-4 font-bold text-white text-lg">Syarat & Ketentuan</h1>
                    </header>

                    {/* Content Section */}
                    <main className="flex-1 bg-white rounded-t-[32px] mt-24 px-6 pt-10 pb-20 shadow-[0_-8px_30px_rgba(0,0,0,0.05)]">
                        <div className="flex flex-col gap-8">
                            {/* Intro */}
                            <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                <ScrollText className="text-orange-500 shrink-0" size={32} />
                                <p className="text-sm text-stone-700 leading-relaxed italic">
                                    "Selamat datang di Pasarantar. Demi kelancaran belanja Bunda, mohon baca ketentuan layanan kami berikut ini ya."
                                </p>
                            </div>

                            {/* Section 1 */}
                            <section className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 text-stone-900 font-bold">
                                    <ShieldCheck className="text-orange-500" size={20} />
                                    <h2>Layanan Pasarantar</h2>
                                </div>
                                <div className="pl-7 text-sm text-stone-600 leading-relaxed flex flex-col gap-2">
                                    <p>Pasarantar adalah platform belanja kebutuhan rumah tangga yang menghubungkan Bunda dengan produk-produk berkualitas pilihan kami.</p>
                                    <p>Dengan mendaftar, Bunda setuju bahwa data yang diberikan (Nama & No HP) benar dan akan digunakan untuk proses pesanan.</p>
                                </div>
                            </section>

                            <hr className="border-stone-100" />

                            {/* Section 2 */}
                            <section className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 text-stone-900 font-bold">
                                    <Scale className="text-orange-500" size={20} />
                                    <h2>Proses Pesanan & Pembayaran</h2>
                                </div>
                                <ul className="pl-7 list-disc text-sm text-stone-600 leading-relaxed flex flex-col gap-2">
                                    <li>Pesanan akan diproses pada jam operasional kami.</li>
                                    <li>Pilihan pembayaran tersedia melalui Transfer Bank, QRIS, maupun Bayar di Tempat (COD).</li>
                                    <li>Untuk metode COD, mohon pastikan Bunda berada di lokasi saat kurir tiba demi kenyamanan bersama.</li>
                                </ul>
                            </section>

                            <hr className="border-stone-100" />

                            {/* Section 3 */}
                            <section className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 text-stone-900 font-bold">
                                    <AlertCircle className="text-orange-500" size={20} />
                                    <h2>Pengembalian & Pembatalan</h2>
                                </div>
                                <div className="pl-7 text-sm text-stone-600 leading-relaxed flex flex-col gap-2">
                                    <p>Pembatalan pesanan hanya dapat dilakukan sebelum status pesanan berubah menjadi "Diproses".</p>
                                    <p>Jika barang yang diterima rusak atau tidak sesuai, Bunda dapat mengajukan komplain maksimal 1x24 jam setelah barang diterima dengan menyertakan bukti foto/video unboxing.</p>
                                </div>
                            </section>

                            <hr className="border-stone-100" />

                            {/* Section 4 */}
                            <section className="flex flex-col gap-3 pb-6">
                                <h2 className="text-stone-900 font-bold italic underline decoration-orange-300 decoration-2 underline-offset-4">Penutup</h2>
                                <p className="text-sm text-stone-600 leading-relaxed">
                                    Syarat dan ketentuan ini dapat berubah sewaktu-waktu sesuai kebijakan Pasarantar. Kami akan memberitahu Bunda jika ada perubahan yang signifikan. Terima kasih sudah mempercayakan belanja Bunda kepada kami.
                                </p>
                            </section>

                            {/* Back Button Bottom */}
                            <button
                                onClick={() => router.back()}
                                className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95"
                            >
                                Saya Mengerti
                            </button>
                        </div>
                    </main>

                    {/* Footer */}
                    <footer className="py-8 text-center bg-white">
                        <p className="text-xs text-stone-400">© 2026 Pasarantar - Solusi Belanja Bunda</p>
                    </footer>
                </div>
            </div>
        </div>
    );
}
