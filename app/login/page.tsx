'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useShopAuth } from '@/contexts/ShopAuthContext';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useShopAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        phone: '',
        password: '',
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const phoneOrEmail = formData.phone;
            const result = await login(phoneOrEmail, formData.password, false);

            if (!result.success) {
                setError(result.error || 'Gagal login');
                return;
            }

            // Redirect based on user type
            router.push(result.redirectTo || '/account');
        } catch (err) {
            setError('Gagal login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center">
            <div className="w-full max-w-md bg-white shadow-2xl overflow-hidden min-h-screen flex flex-col relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 z-0 h-[300px]" />

                <div className="relative z-10 flex flex-col h-full">
                    {/* Header */}
                    <header className="flex items-center px-4 py-3">
                        <Link
                            href="/"
                            className="flex size-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </Link>
                    </header>

                    {/* Logo & Title */}
                    <div className="px-6 pt-12 pb-8 text-center flex flex-col items-center">
                        <h1 className="text-5xl font-extrabold text-white tracking-tighter mb-2 drop-shadow-sm">
                            pasarantar
                        </h1>
                        <p className="text-white/90 font-medium text-lg">Masuk Akun</p>
                    </div>

                    {/* Form Card */}
                    <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-12 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-4">
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
                                        placeholder="Masukkan password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="flex-1 px-4 py-3 outline-none"
                                        required
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

                            {/* Forgot Password */}
                            <div className="text-right">
                                <Link href="/forgot-password" className="text-sm text-orange-500 font-medium hover:text-orange-600">
                                    Lupa password?
                                </Link>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</p>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    'Masuk'
                                )}
                            </button>

                            {/* Divider */}
                            <div className="flex items-center gap-4 my-4">
                                <div className="flex-1 h-px bg-gray-200"></div>
                                <span className="text-sm text-gray-400">atau</span>
                                <div className="flex-1 h-px bg-gray-200"></div>
                            </div>

                            {/* Social Login */}
                            <button
                                type="button"
                                onClick={() => signIn('google', { callbackUrl: `${window.location.origin}/` })}
                                className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-4 rounded-xl transition-all flex items-center justify-center gap-3"
                            >
                                <svg className="size-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Masuk dengan Google
                            </button>

                            {/* Register Link */}
                            <p className="text-center text-gray-600 mt-6">
                                Belum punya akun?{' '}
                                <Link href="/register" className="text-orange-500 font-bold hover:text-orange-600">
                                    Daftar
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
