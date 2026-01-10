'use client';

import React, { useState } from 'react';
import { User } from '@/lib/types';
import { Plus, Edit2, Trash2, Shield, User as UserIcon, X, Save, Search, Lock, UserPlus } from 'lucide-react';
import { Card } from './ui/Card';

interface UserManagerProps {
    users: User[];
    onCreateUser: (user: { email: string; name: string; password: string; role: string }) => Promise<void>;
    onUpdateUser: (id: string, data: { email?: string; name?: string; role?: string; password?: string }) => Promise<void>;
    onDeleteUser: (id: string) => Promise<void>;
}

export const UserManager: React.FC<UserManagerProps> = ({
    users,
    onCreateUser,
    onUpdateUser,
    onDeleteUser,
}) => {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        name: '',
        password: '',
        role: 'user',
    });

    const [editData, setEditData] = useState({
        email: '',
        name: '',
        role: '',
        password: '',
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await onCreateUser(formData);
        setFormData({ email: '', name: '', password: '', role: 'user' });
        setShowCreateForm(false);
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        const updatePayload: any = {
            email: editData.email,
            name: editData.name,
            role: editData.role,
        };

        if (editData.password) {
            updatePayload.password = editData.password;
        }

        await onUpdateUser(editingUser.id, updatePayload);
        setEditingUser(null);
    };

    const handleDelete = async (id: string) => {
        await onDeleteUser(id);
        setDeleteConfirm(null);
    };

    const openEditForm = (user: User) => {
        setEditingUser(user);
        setEditData({
            email: user.email,
            name: user.name,
            role: user.role,
            password: '',
        });
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Main Content Card */}
            <Card className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                            <UserIcon className="text-blue-600" size={24} />
                            User Management
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Kelola akun pengguna sistem dan atur tingkat akses/role mereka.</p>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors text-sm shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                    >
                        <Plus size={18} />
                        Tambah User Baru
                    </button>
                </div>

                {/* Filter & Search Area */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari nama atau email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                        <UserPlus size={16} className="text-slate-400" />
                        <span className="text-xs font-medium text-slate-500">Total: {filteredUsers.length} User</span>
                    </div>
                </div>

                {/* Table Area */}
                <div className="overflow-x-auto -mx-6">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/80 border-y border-slate-200">
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">User</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Email</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Role</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Dibuat</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-9 bg-white text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-slate-200 shadow-sm group-hover:border-blue-200 group-hover:bg-blue-50 transition-all">
                                                <UserIcon size={16} />
                                            </div>
                                            <span className="font-semibold text-slate-900 text-sm whitespace-nowrap">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 text-xs">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${user.role === 'admin'
                                            ? 'bg-purple-50 text-purple-700 border border-purple-100 shadow-sm shadow-purple-500/5'
                                            : 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm shadow-blue-500/5'
                                            }`}>
                                            {user.role === 'admin' ? <Shield size={10} /> : <UserIcon size={10} />}
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 text-[10px] font-medium uppercase tracking-tight">
                                        {new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openEditForm(user)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm"
                                                title="Edit user"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(user.id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm"
                                                title="Delete user"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-24">
                            <div className="size-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
                                <Search className="text-slate-300" size={32} />
                            </div>
                            <h4 className="text-base font-semibold text-slate-900">Tidak ada user ditemukan</h4>
                            <p className="text-sm text-slate-500 mt-1 max-w-[240px] mx-auto">Coba gunakan kata kunci pencarian lain atau periksa filter Anda.</p>
                            <button
                                onClick={() => setSearchTerm('')}
                                className="mt-6 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                Reset Pencarian
                            </button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Create User Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200 border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-base font-semibold text-slate-800">Create New User</h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">Tambah akun admin atau user baru ke sistem.</p>
                            </div>
                            <button onClick={() => setShowCreateForm(false)} className="p-1.5 text-slate-400 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Nama Lengkap</label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                <UserIcon size={16} />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all shadow-sm"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all shadow-sm"
                                            placeholder="john@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Password</label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                <Lock size={16} />
                                            </div>
                                            <input
                                                type="password"
                                                required
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all shadow-sm"
                                                placeholder="••••••••"
                                                minLength={6}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Role / Hak Akses</label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all shadow-sm"
                                        >
                                            <option value="user">User / Staff</option>
                                            <option value="admin">Administrator</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-all text-sm shadow-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm text-sm active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <Save size={16} />
                                    Buat User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200 border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-base font-semibold text-slate-800">Edit User Details</h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">Perbarui informasi profil {editingUser.name}.</p>
                            </div>
                            <button onClick={() => setEditingUser(null)} className="p-1.5 text-slate-400 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleEdit} className="p-6 space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        required
                                        value={editData.name}
                                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all shadow-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={editData.email}
                                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all shadow-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Ganti Password (Opsional)</label>
                                    <input
                                        type="password"
                                        value={editData.password}
                                        onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all shadow-sm"
                                        placeholder="Kosongkan jika tidak ingin merubah"
                                        minLength={6}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Role / Hak Akses</label>
                                    <select
                                        value={editData.role}
                                        onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all shadow-sm"
                                    >
                                        <option value="user">User / Staff</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-all text-sm shadow-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm text-sm active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <Save size={16} />
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-in fade-in zoom-in duration-200 border border-slate-200 overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="size-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
                                <Trash2 size={28} />
                            </div>
                            <h3 className="text-base font-semibold text-slate-900 mb-2">Hapus Akun Pengguna?</h3>
                            <p className="text-xs text-slate-500 mb-6 px-4">
                                Tindakan ini tidak dapat dibatalkan. User yang dihapus tidak akan bisa lagi mengakses sistem ini.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-all text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    className="flex-1 px-4 py-2.5 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 transition-all shadow-sm text-sm active:scale-[0.98]"
                                >
                                    Hapus User
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
