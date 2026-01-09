'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { useShopAuth } from '@/contexts/ShopAuthContext';

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useShopAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [agreed, setAgreed] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Password tidak cocok');
            return;
        }

        if (!agreed) {
            setError('Harap setujui syarat dan ketentuan');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password minimal 8 karakter');
            return;
        }

        setIsLoading(true);

        const result = await register({
            name: formData.name,
            phone: formData.phone,
            password: formData.password,
        });

        if (result.success) {
            // Redirect to login with success message
            router.push('/login');
        } else {
            setError(result.error || 'Gagal registrasi');
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-600 flex flex-col">
            {/* Header */}
            <header className="flex items-center px-4 py-3">
                <Link href="/account" className="flex size-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
                    <ArrowLeft size={24} />
                </Link>
            </header>

            {/* Title */}
            <div className="px-6 pt-4 pb-8 text-center">
                <h1 className="text-3xl font-bold text-white mb-2">Buat Akun</h1>
                <p className="text-white/80">Daftar untuk mulai belanja</p>
            </div>

            {/* Form Card */}
            <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-12 overflow-y-auto">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Name Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
                        <input
                            type="text"
                            placeholder="Masukkan nama lengkap"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                            required
                        />
                    </div>

                    {/* Phone Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">Nomor HP</label>
                        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                            <span className="px-4 py-3 bg-gray-50 text-gray-500 border-r border-gray-200">+62</span>
                            <input
                                type="tel"
                                placeholder="812-3456-7890"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="flex-1 px-4 py-3 outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">Password</label>
                        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Minimal 8 karakter"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="flex-1 px-4 py-3 outline-none"
                                required
                                minLength={8}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="px-4 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">Konfirmasi Password</label>
                        <input
                            type="password"
                            placeholder="Ulangi password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                            required
                        />
                    </div>

                    {/* Terms Checkbox */}
                    <label className="flex items-start gap-3 mt-2 cursor-pointer">
                        <button
                            type="button"
                            onClick={() => setAgreed(!agreed)}
                            className={`size-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${agreed ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                                }`}
                        >
                            {agreed && <Check size={14} className="text-white" />}
                        </button>
                        <span className="text-sm text-gray-600 leading-relaxed">
                            Saya setuju dengan{' '}
                            <Link href="/terms" className="text-orange-500 font-medium">Syarat & Ketentuan</Link>
                            {' '}dan{' '}
                            <Link href="/privacy" className="text-orange-500 font-medium">Kebijakan Privasi</Link>
                        </span>
                    </label>

                    {/* Error Message */}
                    {error && (
                        <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</p>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-4"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Memproses...
                            </>
                        ) : (
                            'Daftar'
                        )}
                    </button>

                    {/* Login Link */}
                    <p className="text-center text-gray-600 mt-4">
                        Sudah punya akun?{' '}
                        <Link href="/login" className="text-orange-500 font-bold hover:text-orange-600">
                            Masuk
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
