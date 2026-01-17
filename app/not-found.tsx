'use client';

import Link from 'next/link';
import { Home, Search, ArrowLeft, ShoppingBag } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-orange-50 to-stone-100 flex items-center justify-center p-4">
            <div className="text-center max-w-md mx-auto">
                {/* Animated 404 Illustration */}
                <div className="relative mb-8">
                    <div className="text-[120px] md:text-[160px] font-extrabold text-orange-100 select-none">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                            <ShoppingBag className="w-16 h-16 text-orange-500 mx-auto" strokeWidth={1.5} />
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                <h1 className="text-2xl md:text-3xl font-bold text-stone-800 mb-3">
                    Halaman Tidak Ditemukan
                </h1>
                <p className="text-stone-500 mb-8 leading-relaxed">
                    Ups! Sepertinya halaman yang Bunda cari tidak ada atau sudah dipindahkan.
                    Yuk kembali berbelanja!
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30"
                    >
                        <Home size={18} />
                        Ke Beranda
                    </Link>
                    <Link
                        href="/products"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-stone-700 font-semibold rounded-xl border border-stone-200 hover:bg-stone-50 transition-all"
                    >
                        <Search size={18} />
                        Cari Produk
                    </Link>
                </div>

                {/* Back Link */}
                <button
                    onClick={() => window.history.back()}
                    className="mt-6 inline-flex items-center gap-1 text-sm text-stone-400 hover:text-orange-500 transition-colors"
                >
                    <ArrowLeft size={14} />
                    Kembali ke halaman sebelumnya
                </button>

                {/* Decorative Elements */}
                <div className="mt-12 flex items-center justify-center gap-2 text-stone-300">
                    <div className="w-2 h-2 rounded-full bg-orange-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
}
