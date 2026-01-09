'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Category, CategoryForm } from '@/lib/types';
import { categoriesAPI } from '@/lib/api';
import { Card } from './ui/Card';
import { Plus, Trash2, Edit2, Check, X, Image as ImageIcon, ExternalLink, MoreVertical, Loader2, Upload, Hash } from 'lucide-react';
import { useToast } from './ui/Toast';
import Image from 'next/image';

const COLOR_OPTIONS = [
    { label: 'Blue', value: 'text-blue-400' },
    { label: 'Orange', value: 'text-orange-500' },
    { label: 'Yellow', value: 'text-yellow-500' },
    { label: 'Red', value: 'text-red-400' },
    { label: 'Green', value: 'text-green-500' },
    { label: 'Purple', value: 'text-purple-500' },
    { label: 'Pink', value: 'text-pink-400' },
    { label: 'Emerald', value: 'text-emerald-500' },
];

export const CategoryManager: React.FC = () => {
    const toast = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [formData, setFormData] = useState<CategoryForm>({
        name: '',
        slug: '',
        image: '',
        color: 'text-blue-400',
        order: 0,
        isActive: true
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await categoriesAPI.getAll();
            setCategories(data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            toast.error('Gagal memuat kategori');
        } finally {
            setLoading(false);
        }
    };

    const handleNameChange = (name: string) => {
        const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        setFormData(prev => ({ ...prev, name, slug: editingCategory ? prev.slug : slug }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                const updated = await categoriesAPI.update(editingCategory.id, formData);
                setCategories(prev => prev.map(c => c.id === editingCategory.id ? updated : c));
                toast.success('Kategori berhasil diperbarui');
            } else {
                const created = await categoriesAPI.create(formData);
                setCategories(prev => [...prev, created]);
                toast.success('Kategori berhasil ditambahkan');
            }
            handleCloseModal();
        } catch (error: any) {
            console.error('Failed to save category:', error);
            toast.error(error.message || 'Gagal menyimpan kategori');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus kategori ini? Produk yang terkait dengan kategori ini akan menjadi tidak berkategori.')) return;
        try {
            await categoriesAPI.delete(id);
            setCategories(prev => prev.filter(c => c.id !== id));
            toast.success('Kategori berhasil dihapus');
        } catch (error) {
            console.error('Failed to delete category:', error);
            toast.error('Gagal menghapus kategori');
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            slug: category.slug,
            image: category.image || '',
            color: category.color || 'text-blue-400',
            order: category.order,
            isActive: category.isActive
        });
        setShowFormModal(true);
    };

    const handleCloseModal = () => {
        setShowFormModal(false);
        setEditingCategory(null);
        setFormData({
            name: '',
            slug: '',
            image: '',
            color: 'text-blue-400',
            order: 0,
            isActive: true
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const uploadData = new FormData();
            uploadData.append('file', file);
            uploadData.append('folder', 'categories');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: uploadData,
            });

            if (!response.ok) {
                const error = await response.json();
                toast.error(error.error || 'Gagal mengupload icon');
                return;
            }

            const data = await response.json();
            setFormData(prev => ({ ...prev, image: data.url }));
            toast.success('Icon berhasil diupload');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Gagal mengupload icon');
        } finally {
            setIsUploading(false);
            if (imageInputRef.current) {
                imageInputRef.current.value = '';
            }
        }
    };

    const toggleStatus = async (category: Category) => {
        try {
            const updated = await categoriesAPI.update(category.id, { isActive: !category.isActive });
            setCategories(prev => prev.map(c => c.id === category.id ? updated : c));
            toast.success(`Kategori ${!category.isActive ? 'diaktifkan' : 'dinonaktifkan'}`);
        } catch (error) {
            toast.error('Gagal mengubah status');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-slate-800">Manajemen Kategori Produk</h3>
                <button
                    onClick={() => setShowFormModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    Tambah Kategori
                </button>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Icon</th>
                                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Nama/Slug</th>
                                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Warna Shop</th>
                                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Urutan</th>
                                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
                                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="py-8 text-center text-slate-500">Memuat data...</td></tr>
                            ) : categories.length === 0 ? (
                                <tr><td colSpan={6} className="py-8 text-center text-slate-500">Belum ada kategori.</td></tr>
                            ) : (
                                categories.map((category) => (
                                    <tr key={category.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                                                {category.image ? (
                                                    <Image src={category.image} alt={category.name} fill className="object-cover p-1" />
                                                ) : (
                                                    <div className="text-slate-400">
                                                        <ImageIcon size={20} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900">{category.name}</span>
                                                <span className="text-xs text-slate-500 font-mono">/{category.slug}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className={`w-3 h-3 rounded-full bg-current ${category.color || 'text-slate-400'}`}></div>
                                                <span className={`text-[10px] font-bold ${category.color || 'text-slate-400'}`}>
                                                    {(category.color || '').replace('text-', '').replace('-400', '').replace('-500', '').toUpperCase()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm text-slate-600">
                                            {category.order}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => toggleStatus(category)}
                                                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors border
                                                    ${category.isActive
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}
                                            >
                                                {category.isActive ? 'Aktif' : 'Nonaktif'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(category)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Category Form Modal */}
            {showFormModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                                </h2>
                                <p className="text-sm text-slate-500">Atur kategori produk untuk mempermudah pencarian di toko online.</p>
                            </div>
                            <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Kategori <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => handleNameChange(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="Contoh: Ikan Laut"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                                            <span>Slug (URL)</span>
                                            <span className="text-[10px] text-slate-400">Auto-generated</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                <Hash size={14} />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                value={formData.slug}
                                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm bg-slate-50"
                                                placeholder="ikan-laut"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Warna Aksen (UI Shop)</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {COLOR_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, color: opt.value })}
                                                    className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all
                                                        ${formData.color === opt.value
                                                            ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                                                            : 'bg-white border-slate-200 hover:border-blue-200'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full bg-current ${opt.value}`}></div>
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Icon/Gambar Kategori</label>
                                        <div className="flex flex-col gap-3">
                                            <input
                                                type="file"
                                                ref={imageInputRef}
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />

                                            <div
                                                onClick={() => !isUploading && imageInputRef.current?.click()}
                                                className={`relative aspect-square max-w-[160px] mx-auto border-2 border-dashed rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center bg-slate-50 overflow-hidden group
                                                    ${formData.image ? 'border-blue-200' : 'border-slate-300 hover:border-blue-400'}
                                                    ${isUploading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            >
                                                {formData.image ? (
                                                    <>
                                                        <Image
                                                            src={formData.image}
                                                            alt="Preview"
                                                            fill
                                                            className="object-contain p-2 transition-transform group-hover:scale-105"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <div className="bg-white/90 p-1.5 rounded-lg flex items-center gap-1.5 text-slate-800 text-[10px] font-bold">
                                                                <Upload size={12} />
                                                                GANTI
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center p-4">
                                                        {isUploading ? (
                                                            <Loader2 className="w-8 h-8 mx-auto text-blue-500 animate-spin mb-2" />
                                                        ) : (
                                                            <ImageIcon className="w-8 h-8 mx-auto text-slate-400 mb-2 group-hover:text-blue-500 transition-colors" />
                                                        )}
                                                        <p className="text-xs font-medium text-slate-600">
                                                            {isUploading ? 'Uploading...' : 'Upload Icon'}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <input
                                                type="text"
                                                value={formData.image || ''}
                                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-[10px] h-8"
                                                placeholder="Atau URL Icon..."
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Urutan Tampil</label>
                                        <input
                                            type="number"
                                            value={formData.order}
                                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                        />
                                    </div>
                                    <div className="flex items-center pt-2">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isActive}
                                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                                    className="sr-only"
                                                />
                                                <div className={`w-10 h-5 rounded-full transition-colors border ${formData.isActive ? 'bg-blue-600 border-blue-600' : 'bg-slate-100 border-slate-200'}`}></div>
                                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.isActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                            </div>
                                            <span className="text-sm font-semibold text-slate-700">Aktifkan Kategori</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Live Preview (Shop Style) */}
                            <div className="mt-4 p-4 border border-blue-50 rounded-2xl bg-slate-50/50">
                                <label className="block text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-3">Live Preview (Mobile Shop Style)</label>
                                <div className="flex justify-center">
                                    <div className="flex flex-col items-center gap-2 max-w-[80px]">
                                        <div className="relative size-16 sm:size-20 bg-white rounded-2xl flex items-center justify-center p-3 shadow-sm border border-slate-100 group transition-all duration-300">
                                            {formData.image ? (
                                                <Image src={formData.image} alt="Preview" fill className="object-contain p-2.5" />
                                            ) : (
                                                <ImageIcon className="text-gray-300" size={32} />
                                            )}
                                        </div>
                                        <span className={`text-[11px] font-bold text-center leading-tight transition-colors ${formData.color || 'text-stone-700'}`}>
                                            {formData.name || 'Nama Kategori'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </form>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-white transition-all shadow-sm"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                            >
                                {editingCategory ? 'Simpan Perubahan' : 'Buat Kategori'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
