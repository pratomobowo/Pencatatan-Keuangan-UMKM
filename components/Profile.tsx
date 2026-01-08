'use client';

import React, { useState } from 'react';
import { User as UserIcon, Lock, Save, Mail, Shield } from 'lucide-react';

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
        <div className="space-y-6 animate-fade-in max-w-4xl">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Profile</h2>
                <p className="text-slate-600 text-sm mt-1">Manage your account settings</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-blue-600" />
                        Account Information
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900">
                                {user.name}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email
                            </label>
                            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900">
                                {user.email}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Role
                            </label>
                            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}>
                                    {user.role === 'admin' && <Shield size={12} />}
                                    {user.role}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Change Password Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-blue-600" />
                        Change Password
                    </h3>

                    {error && (
                        <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Current Password
                            </label>
                            <input
                                type="password"
                                required
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="••••••••"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="••••••••"
                                minLength={6}
                                disabled={loading}
                            />
                            <p className="text-xs text-slate-500 mt-1">Minimal 6 karakter</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="••••••••"
                                minLength={6}
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Updating...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    <span>Change Password</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
