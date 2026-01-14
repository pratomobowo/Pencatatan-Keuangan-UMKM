'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { useShopAuth } from '@/contexts/ShopAuthContext';

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useShopAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });

    const [error, setError] = useState('');
    const [step, setStep] = useState<'details' | 'otp'>('details');
    const [otpCode, setOtpCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(0);
    const [agreed, setAgreed] = useState(false);

    useEffect(() => {
        const phone = searchParams.get('phone');
        const isUnverified = searchParams.get('verified') === 'false';

        if (phone) {
            setFormData(prev => ({ ...prev, phone }));
        }

        if (isUnverified) {
            setError('Silakan lengkapi pendaftaran Bunda dengan verifikasi WhatsApp.');
        }
    }, [searchParams]);

    // Filter non-digits for phone input
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setFormData({ ...formData, phone: value });
    };

    const startResendTimer = () => {
        setResendCountdown(60);
        const timer = setInterval(() => {
            setResendCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

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

        try {
            const response = await fetch('/api/shop/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Gagal registrasi');
            } else if (data.requiresVerification) {
                setStep('otp');
                startResendTimer();
            } else {
                // Should not happen with current logic, but fallback
                router.push('/login?registered=success');
            }
        } catch (err) {
            setError('Terjadi kesalahan saat registrasi');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otpCode.length !== 6) return;

        setIsVerifying(true);
        setError('');

        try {
            const response = await fetch('/api/shop/auth/register/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: formData.phone,
                    code: otpCode,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Kode OTP salah');
            } else {
                // Success! Auto login
                const loginResult = await login(formData.phone, formData.password, false);
                if (loginResult.success) {
                    router.push('/account');
                } else {
                    router.push('/login?verified=true');
                }
            }
        } catch (err) {
            setError('Terjadi kesalahan saat verifikasi');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCountdown > 0) return;

        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/shop/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                    password: formData.password,
                }),
            });

            if (response.ok) {
                startResendTimer();
            } else {
                const data = await response.json();
                setError(data.error || 'Gagal mengirim ulang OTP');
            }
        } catch (err) {
            setError('Gagal mengirim ulang OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);

    // Legal Content Modals
    const LegalModal = ({ isOpen, onClose, title, content }: { isOpen: boolean, onClose: () => void, title: string, content: React.ReactNode }) => {
        if (!isOpen) return null;
        return (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
                <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={onClose} />
                <div className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-300">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                        <h3 className="font-bold text-lg text-stone-900">{title}</h3>
                        <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-full transition-colors text-stone-400">&times;</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 text-stone-600 space-y-6">
                        {content}
                    </div>
                    <div className="p-6 bg-stone-50 border-t border-stone-100">
                        <button
                            onClick={onClose}
                            className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition-all active:scale-95"
                        >
                            Saya Mengerti
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const termsContent = (
        <>
            <section className="space-y-3">
                <div className="font-bold text-stone-900 flex items-center gap-2">
                    <span className="size-2 bg-orange-500 rounded-full" />
                    Layanan Pasarantar
                </div>
                <p className="text-sm leading-relaxed pl-4">Pasarantar adalah platform belanja kebutuhan rumah tangga yang menghubungkan Bunda dengan produk-produk berkualitas pilihan kami. Dengan mendaftar, Bunda setuju bahwa data yang diberikan benar dan akan digunakan untuk proses pesanan.</p>
            </section>
            <section className="space-y-3">
                <div className="font-bold text-stone-900 flex items-center gap-2">
                    <span className="size-2 bg-orange-500 rounded-full" />
                    Proses Pesanan & Pembayaran
                </div>
                <ul className="text-sm leading-relaxed pl-4 list-disc space-y-2">
                    <li>Pesanan diproses pada jam operasional kami.</li>
                    <li>Pembayaran melalui Transfer Bank, QRIS, maupun COD.</li>
                    <li>Metode COD wajib memastikan Bunda ada di lokasi saat kurir tiba.</li>
                </ul>
            </section>
            <section className="space-y-3">
                <div className="font-bold text-stone-900 flex items-center gap-2">
                    <span className="size-2 bg-orange-500 rounded-full" />
                    Pengembalian & Pembatalan
                </div>
                <p className="text-sm leading-relaxed pl-4">Pembatalan hanya bisa sebelum status "Diproses". Komplain barang rusak/tidak sesuai maksimal 1x24 jam dengan bukti foto/video unboxing.</p>
            </section>
        </>
    );

    const privacyContent = (
        <>
            <section className="space-y-3">
                <div className="font-bold text-stone-900 flex items-center gap-2">
                    <span className="size-2 bg-orange-500 rounded-full" />
                    Data yang Kami Kumpulkan
                </div>
                <p className="text-sm leading-relaxed pl-4">Nama Lengkap, Nomor WhatsApp (OTP), Alamat Pengiriman, dan Riwayat Pesanan Bunda.</p>
            </section>
            <section className="space-y-3">
                <div className="font-bold text-stone-900 flex items-center gap-2">
                    <span className="size-2 bg-orange-500 rounded-full" />
                    Keamanan Data
                </div>
                <p className="text-sm leading-relaxed pl-4">Data Bunda HANYA digunakan untuk proses pesanan dan info promo spesial. Kami menjamin tidak akan menyebarkan atau menjual data Bunda ke pihak manapun.</p>
            </section>
        </>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center">
            {/* Legal Modals */}
            <LegalModal
                isOpen={showTerms}
                onClose={() => setShowTerms(false)}
                title="Syarat & Ketentuan"
                content={termsContent}
            />
            <LegalModal
                isOpen={showPrivacy}
                onClose={() => setShowPrivacy(false)}
                title="Kebijakan Privasi"
                content={privacyContent}
            />

            <div className="w-full max-w-md bg-white shadow-2xl overflow-hidden min-h-screen flex flex-col relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 z-0 h-[300px]" />

                <div className="relative z-10 flex flex-col h-full">
                    {/* Header */}
                    <header className="flex items-center px-4 py-3">
                        <button
                            onClick={() => step === 'otp' ? setStep('details') : router.push('/')}
                            className="flex size-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                    </header>

                    {/* Title */}
                    <div className="px-6 pt-12 pb-8 text-center flex flex-col items-center">
                        <h1 className="text-5xl font-extrabold text-white tracking-tighter mb-2 drop-shadow-sm">
                            pasarantar
                        </h1>
                        <p className="text-white/90 font-medium text-lg">
                            {step === 'details' ? 'Daftar Akun' : 'Verifikasi WhatsApp'}
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-12 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)] overflow-y-auto">
                        {step === 'details' ? (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                {/* Name Input */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        placeholder="Masukkan nama lengkap"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all font-medium"
                                        required
                                    />
                                </div>

                                {/* Phone Input */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-gray-700">Nomor HP / WhatsApp</label>
                                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                                        <span className="px-4 py-3 bg-gray-50 text-gray-500 border-r border-gray-200 font-bold">+62</span>
                                        <input
                                            type="tel"
                                            placeholder="812-3456-7890"
                                            value={formData.phone}
                                            onChange={handlePhoneChange}
                                            className="flex-1 px-4 py-3 outline-none font-bold tracking-wider"
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400">Kode OTP akan dikirim ke nomor WhatsApp ini.</p>
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
                                        <button
                                            type="button"
                                            onClick={() => setShowTerms(true)}
                                            className="text-orange-500 font-medium hover:underline"
                                        >
                                            Syarat & Ketentuan
                                        </button>
                                        {' '}dan{' '}
                                        <button
                                            type="button"
                                            onClick={() => setShowPrivacy(true)}
                                            className="text-orange-500 font-medium hover:underline"
                                        >
                                            Kebijakan Privasi
                                        </button>
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
                                        'Daftar Sekarang'
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="flex flex-col gap-6 pt-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="text-center">
                                    <div className="size-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Check size={40} />
                                    </div>
                                    <h2 className="text-xl font-bold text-stone-900 mb-2">Cek WhatsApp Bunda</h2>
                                    <p className="text-sm text-gray-500 leading-relaxed px-4">
                                        Kami telah mengirimkan 6 digit kode OTP ke nomor <span className="font-bold text-stone-900">+62 {formData.phone}</span>
                                    </p>
                                </div>

                                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="text"
                                            maxLength={6}
                                            placeholder="000000"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                            className="w-full text-center text-4xl font-black tracking-[1em] py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none transition-all placeholder:text-gray-200"
                                            autoFocus
                                            required
                                        />
                                        <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">Masukkan 6 Digit Kode</p>
                                    </div>

                                    {error && (
                                        <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isVerifying || otpCode.length !== 6}
                                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isVerifying ? (
                                            <>
                                                <Loader2 size={20} className="animate-spin" />
                                                Memverifikasi...
                                            </>
                                        ) : (
                                            'Verifikasi Sekarang'
                                        )}
                                    </button>

                                    <div className="text-center">
                                        <p className="text-sm text-gray-500 mb-2">Belum menerima kode?</p>
                                        {resendCountdown > 0 ? (
                                            <p className="text-orange-500 font-bold">Kirim ulang dalam {resendCountdown}s</p>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleResendOtp}
                                                disabled={isLoading}
                                                className="text-orange-500 font-bold hover:text-orange-600 underline"
                                            >
                                                Kirim Ulang OTP
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Footer Links */}
                        <div className="mt-8 pt-8 border-t border-gray-100">
                            <p className="text-center text-gray-600">
                                Sudah punya akun?{' '}
                                <Link href="/login" className="text-orange-500 font-bold hover:text-orange-600">
                                    Masuk
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-orange-500 flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={48} />
            </div>
        }>
            <RegisterForm />
        </Suspense>
    );
}

