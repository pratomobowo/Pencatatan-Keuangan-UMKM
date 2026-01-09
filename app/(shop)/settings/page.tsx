'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, User, Phone, Mail, Lock, Loader2, Save, LogOut } from 'lucide-react';
import { useShopAuth } from '@/contexts/ShopAuthContext';
import { useNotifications } from '@/contexts/NotificationContext';

export default function SettingsPage() {
    const { customer, isAuthenticated, isLoading: authLoading, logout, refreshCustomer } = useShopAuth();
    const { addNotification } = useNotifications();
    const [isLoading, setIsLoading] = useState(false);
    const [passLoading, setPassLoading] = useState(false);

    // Profile State
    const [profileData, setProfileData] = useState({
        name: customer?.name || '',
        email: customer?.email || '',
        phone: customer?.phone || '',
    });

    // Update state when customer data loads
    useEffect(() => {
        if (customer) {
            setProfileData({
                name: customer.name || '',
                email: customer.email || '',
                phone: customer.phone || '',
            });
        }
    }, [customer]);
    // Password State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch('/api/shop/customers/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData),
            });

            if (response.ok) {
                await refreshCustomer();
                addNotification(
                    'Profil Diperbarui',
                    'Informasi profil Anda berhasil disimpan.',
                    'success'
                );
            } else {
                const data = await response.json();
                addNotification(
                    'Gagal Update',
                    data.error || 'Terjadi kesalahan saat memperbarui profil.',
                    'error'
                );
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            addNotification(
                'Password Tidak Cocok',
                'Konfirmasi password baru tidak sesuai.',
                'warning'
            );
            return;
        }

        setPassLoading(true);
        try {
            const response = await fetch('/api/shop/customers/me/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
            });

            if (response.ok) {
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                addNotification(
                    'Password Diubah',
                    'Password Anda berhasil diperbarui.',
                    'success'
                );
            } else {
                const data = await response.json();
                addNotification(
                    'Gagal Ubah Password',
                    data.error || 'Password saat ini tidak valid.',
                    'error'
                );
            }
        } catch (err) {
            console.error(err);
        } finally {
            setPassLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-orange-500" size={40} />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col text-stone-900">
                <header className="bg-white border-b sticky top-0 z-20 px-4 py-3 flex items-center gap-4">
                    <Link href="/account" className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                        <ChevronLeft size={24} className="text-gray-700" />
                    </Link>
                    <h1 className="text-lg font-bold">Pengaturan</h1>
                </header>
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <h2 className="text-xl font-bold mb-2">Belum Login</h2>
                    <p className="text-gray-500 mb-6">Silakan login untuk mengelola pengaturan akun Anda.</p>
                    <Link href="/login" className="bg-orange-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg">
                        Masuk Sekarang
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pb-24 text-stone-900">
            <header className="bg-white border-b sticky top-0 z-20 px-4 py-3 flex items-center gap-4">
                <Link href="/account" className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                    <ChevronLeft size={24} className="text-gray-700" />
                </Link>
                <h1 className="text-lg font-bold">Pengaturan</h1>
            </header>

            <main className="flex-1 p-4 flex flex-col gap-6">
                {/* Profile Section */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
                        <User size={18} className="text-orange-500" />
                        <h2 className="font-bold text-sm uppercase tracking-wider text-gray-500">Profil Saya</h2>
                    </div>
                    <form onSubmit={handleProfileUpdate} className="p-4 flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-gray-400 ml-1">Nama Lengkap</label>
                            <div className="flex items-center border border-gray-200 rounded-xl px-4 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-50 transition-all">
                                <User size={18} className="text-gray-400 mr-2" />
                                <input
                                    type="text"
                                    className="flex-1 py-3 outline-none bg-transparent"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-gray-400 ml-1">Nomor HP</label>
                            <div className="flex items-center border border-gray-200 rounded-xl px-4 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-50 transition-all">
                                <Phone size={18} className="text-gray-400 mr-2" />
                                <input
                                    type="tel"
                                    className="flex-1 py-3 outline-none bg-transparent"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                    required
                                    placeholder="0812xxxxxxxx"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-gray-400 ml-1">Email</label>
                            <div className="flex items-center border border-gray-200 rounded-xl px-4 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-50 transition-all">
                                <Mail size={18} className="text-gray-400 mr-2" />
                                <input
                                    type="email"
                                    className="flex-1 py-3 outline-none bg-transparent"
                                    value={profileData.email}
                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                    placeholder="yourname@gmail.com"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-100 hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={18} />}
                            Simpan Profil
                        </button>
                    </form>
                </section>

                {/* Password Section */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
                        <Lock size={18} className="text-orange-500" />
                        <h2 className="font-bold text-sm uppercase tracking-wider text-gray-500">Ubah Password</h2>
                    </div>
                    <form onSubmit={handlePasswordUpdate} className="p-4 flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-gray-400 ml-1">Password Sekarang</label>
                            <input
                                type="password"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-50 transition-all"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-gray-400 ml-1">Password Baru</label>
                            <input
                                type="password"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-50 transition-all"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                required
                                minLength={8}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-gray-400 ml-1">Konfirmasi Password</label>
                            <input
                                type="password"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-50 transition-all"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={passLoading}
                            className="w-full bg-stone-800 text-white font-bold py-3.5 rounded-xl hover:bg-stone-900 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
                        >
                            {passLoading ? <Loader2 className="animate-spin" size={20} /> : <Lock size={18} />}
                            Ubah Password
                        </button>
                    </form>
                </section>

                {/* Logout Action */}
                <button
                    onClick={() => {
                        logout();
                    }}
                    className="w-full p-4 bg-red-50 text-red-600 font-bold rounded-2xl border border-red-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    <LogOut size={20} />
                    Keluar dari Akun
                </button>
            </main>
        </div>
    );
}
