'use client';

import React, { useState } from 'react';
import { User as UserIcon, Lock, Save, Mail, Shield } from 'lucide-react';
import { Card } from './ui/Card';

interface ProfileProps {
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
    onChangePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

export const Profile: React.FC<ProfileProps> = ({ user, onChangePassword }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword.length < 6) {
            setError('Password baru minimal 6 karakter');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Password baru dan konfirmasi tidak cocok');
            return;
        }

        setLoading(true);
        try {
            await onChangePassword(oldPassword, newPassword);
            setSuccess('Password berhasil diubah!');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.message || 'Gagal mengubah password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Main Content Card */}
            <Card className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
                            <UserIcon className="text-blue-600" size={24} />
                            User Profile
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Manage your account settings and security preferences.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Profile Info Section */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                            <UserIcon size={18} className="text-slate-400" />
                            Account Information
                        </h3>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Display Name</label>
                                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium flex items-center gap-3">
                                    <UserIcon size={16} className="text-slate-400" />
                                    {user.name}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium flex items-center gap-3">
                                    <Mail size={16} className="text-slate-400" />
                                    {user.email}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Access Level</label>
                                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider ${user.role === 'admin'
                                        ? 'bg-purple-50 text-purple-700 border border-purple-100 shadow-sm shadow-purple-500/5'
                                        : 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm shadow-blue-500/5'
                                        }`}>
                                        {user.role === 'admin' ? <Shield size={12} /> : <UserIcon size={12} />}
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-blue-800">
                            <Shield size={20} className="text-blue-500 shrink-0" />
                            <p className="text-xs leading-relaxed">
                                Akun Anda terintegrasi dengan sistem manajemen UMKM. Hubungi administrator jika terdapat kesalahan data profil.
                            </p>
                        </div>
                    </div>

                    {/* Change Password Section */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                            <Lock size={18} className="text-slate-400" />
                            Security & Password
                        </h3>

                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-800 animate-in fade-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-800 animate-in fade-in slide-in-from-top-2">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm transition-all shadow-sm"
                                        placeholder="••••••••"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm transition-all shadow-sm"
                                        placeholder="••••••••"
                                        minLength={6}
                                        disabled={loading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Confirm New
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm transition-all shadow-sm"
                                        placeholder="••••••••"
                                        minLength={6}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">Requirement: Minimal 6 characters</p>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-4 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Saving Changes...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        <span>Update Password</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </Card>
        </div>
    );
};
