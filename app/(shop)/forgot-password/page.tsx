'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Loader2, KeyRound, Smartphone, CheckCircle2 } from 'lucide-react';

type Step = 'phone' | 'otp' | 'password' | 'success';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('phone');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        phone: '',
        otp: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [resetToken, setResetToken] = useState('');

    // Step 1: Send OTP
    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: formData.phone }),
            });

            const data = await response.json();

            if (response.ok) {
                setStep('otp');
            } else {
                setError(data.error || 'Gagal mengirim OTP');
            }
        } catch (err) {
            setError('Gagal menghubungi server');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: formData.phone,
                    code: formData.otp
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setResetToken(data.resetToken);
                setStep('password');
            } else {
                setError(data.error || 'OTP tidak valid');
            }
        } catch (err) {
            setError('Gagal verifikasi OTP');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Konfirmasi password tidak cocok');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('Password minimal 6 karakter');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/password/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resetToken,
                    newPassword: formData.newPassword
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setStep('success');
            } else {
                setError(data.error || 'Gagal reset password');
            }
        } catch (err) {
            setError('Gagal memperbarui password');
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
                            href="/login"
                            className="flex size-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </Link>
                    </header>

                    {/* Title */}
                    <div className="px-6 pt-12 pb-8 text-center flex flex-col items-center">
                        <h1 className="text-4xl font-extrabold text-white tracking-tighter mb-2 drop-shadow-sm">
                            Lupa Password
                        </h1>
                        <p className="text-white/90 font-medium text-lg">
                            {step === 'phone' && 'Verifikasi Nomor HP'}
                            {step === 'otp' && 'Masukkan Kode OTP'}
                            {step === 'password' && 'Password Baru'}
                            {step === 'success' && 'Reset Berhasil'}
                        </p>
                    </div>

                    {/* Content Card */}
                    <div className="flex-1 bg-white rounded-t-3xl px-6 pt-10 pb-12 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium flex items-start gap-3">
                                <div className="mt-0.5 min-w-4 text-red-500">❌</div>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Step 1: Phone Input */}
                        {step === 'phone' && (
                            <form onSubmit={handleSendOTP} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Nomor HP Terdaftar</label>
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
                                    <p className="text-xs text-gray-500 italic mt-2">
                                        * Kode OTP akan dikirimkan melalui WhatsApp ke nomor ini.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Smartphone size={18} />}
                                    Kirim OTP via WhatsApp
                                </button>
                            </form>
                        )}

                        {/* Step 2: OTP Input */}
                        {step === 'otp' && (
                            <form onSubmit={handleVerifyOTP} className="space-y-6">
                                <div className="text-center mb-4">
                                    <p className="text-sm text-gray-600">
                                        Kode OTP telah dikirim ke WhatsApp <span className="font-bold">+62 {formData.phone}</span>
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Masukkan 6 Digit OTP</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        placeholder="000000"
                                        value={formData.otp}
                                        onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                                        className="w-full px-6 py-4 outline-none border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-center text-3xl font-bold tracking-[0.5em] text-gray-800"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                    Verifikasi OTP
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStep('phone')}
                                    className="w-full text-sm text-gray-500 font-medium hover:text-gray-700 transition-colors"
                                >
                                    Ganti Nomor HP
                                </button>
                            </form>
                        )}

                        {/* Step 3: Password Reset */}
                        {step === 'password' && (
                            <form onSubmit={handleResetPassword} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Password Baru</label>
                                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Minimal 6 karakter"
                                            value={formData.newPassword}
                                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                            className="flex-1 px-4 py-3 outline-none"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="px-4 text-gray-400"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Konfirmasi Password Baru</label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Ulangi password baru"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full px-4 py-3 outline-none border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-4"
                                >
                                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <KeyRound size={18} />}
                                    Simpan Password Baru
                                </button>
                            </form>
                        )}

                        {/* Step 4: Success */}
                        {step === 'success' && (
                            <div className="text-center space-y-8 pt-8">
                                <div className="flex justify-center">
                                    <div className="size-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner shadow-emerald-200 transition-all animate-bounce">
                                        <CheckCircle2 size={48} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-gray-800">Alhamdulillah Beres!</h3>
                                    <p className="text-gray-600">
                                        Password bunda sudah berhasil diperbarui. Sekarang silakan login kembali pakai password baru ya.
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push('/login')}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all"
                                >
                                    Kembali ke Login
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
