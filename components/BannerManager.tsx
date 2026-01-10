'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PromoBanner } from '@/lib/types';
import { bannersAPI } from '@/lib/api';
import { Card } from './ui/Card';
import { Plus, Trash2, Edit2, Check, X, Image as ImageIcon, ExternalLink, MoreVertical, Loader2, Upload } from 'lucide-react';
import { useToast } from './ui/Toast';
import Image from 'next/image';

export const BannerManager: React.FC = () => {
    const toast = useToast();
    const [banners, setBanners] = useState<PromoBanner[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        badge: '',
        image: '',
        buttonText: 'Belanja Sekarang',
        link: '/products',
        order: 0,
        isActive: true
    });

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const data = await bannersAPI.getAll();
            setBanners(data);
        } catch (error) {
            console.error('Failed to fetch banners:', error);
            toast.error('Gagal memuat banner');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingBanner) {
                const updated = await bannersAPI.update(editingBanner.id, formData);
                setBanners(prev => prev.map(b => b.id === editingBanner.id ? updated : b));
                toast.success('Banner berhasil diperbarui');
            } else {
                const created = await bannersAPI.create(formData);
                setBanners(prev => [...prev, created]);
                toast.success('Banner berhasil ditambahkan');
            }
            handleCloseModal();
        } catch (error) {
            console.error('Failed to save banner:', error);
            toast.error('Gagal menyimpan banner');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus banner ini?')) return;
        try {
            await bannersAPI.delete(id);
            setBanners(prev => prev.filter(b => b.id !== id));
            toast.success('Banner berhasil dihapus');
        } catch (error) {
            console.error('Failed to delete banner:', error);
            toast.error('Gagal menghapus banner');
        }
    };

    const handleEdit = (banner: PromoBanner) => {
        setEditingBanner(banner);
        setFormData({
            title: banner.title,
            subtitle: banner.subtitle || '',
            badge: banner.badge || '',
            image: banner.image,
            buttonText: banner.buttonText,
            link: banner.link,
            order: banner.order,
            isActive: banner.isActive
        });
        setShowFormModal(true);
    };

    const handleCloseModal = () => {
        setShowFormModal(false);
        setEditingBanner(null);
        setFormData({
            title: '',
            subtitle: '',
            badge: '',
            image: '',
            buttonText: 'Belanja Sekarang',
            link: '/products',
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
            uploadData.append('folder', 'banners');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: uploadData,
            });

            if (!response.ok) {
                const error = await response.json();
                toast.error(error.error || 'Gagal mengupload gambar');
                return;
            }

            const data = await response.json();
            setFormData(prev => ({ ...prev, image: data.url }));
            toast.success('Gambar berhasil diupload');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Gagal mengupload gambar');
        } finally {
            setIsUploading(false);
            if (imageInputRef.current) {
                imageInputRef.current.value = '';
            }
        }
    };

    const toggleStatus = async (banner: PromoBanner) => {
        try {
            const updated = await bannersAPI.update(banner.id, { isActive: !banner.isActive });
            setBanners(prev => prev.map(b => b.id === banner.id ? updated : b));
            toast.success(`Banner ${!banner.isActive ? 'diaktifkan' : 'dinonaktifkan'}`);
        } catch (error) {
            toast.error('Gagal mengubah status');
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">Manajemen Banner Promo</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Kelola banner promosi yang tampil di halaman utama toko.</p>
                    </div>
                    <button
                        onClick={() => setShowFormModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                        <Plus size={16} />
                        Tambah Banner
                    </button>
                </div>

                {/* Banner Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr className="border-b border-slate-200">
                                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Preview</th>
                                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Info Banner</th>
                                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Urutan</th>
                                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
                                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="py-8 text-center text-slate-500">Memuat data...</td></tr>
                            ) : banners.length === 0 ? (
                                <tr><td colSpan={5} className="py-8 text-center text-slate-500">Belum ada banner promo.</td></tr>
                            ) : (
                                banners.map((banner) => (
                                    <tr key={banner.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="relative w-32 aspect-[2/1] rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                                                {banner.image ? (
                                                    <Image src={banner.image} alt={banner.title} fill className="object-cover" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-slate-400">
                                                        <ImageIcon size={20} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-slate-900">{banner.title}</span>
                                                    {banner.badge && (
                                                        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-semibold rounded uppercase">
                                                            {banner.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-slate-500 line-clamp-1">{banner.subtitle}</span>
                                                <div className="flex items-center gap-2 mt-1 text-[10px] text-blue-600">
                                                    <ExternalLink size={10} />
                                                    <span className="hover:underline cursor-pointer">{banner.link}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm text-slate-600">
                                            {banner.order}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => toggleStatus(banner)}
                                                className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-colors border
                                                    ${banner.isActive
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}
                                            >
                                                {banner.isActive ? 'Aktif' : 'Nonaktif'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(banner)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(banner.id)}
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

            {/* Banner Form Modal */}
            {showFormModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 text-sm">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">
                                    {editingBanner ? 'Edit Banner Promo' : 'Tambah Banner Promo'}
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">Konfigurasi visual dan teks banner di halaman utama toko.</p>
                            </div>
                            <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4 text-xs font-semibold">
                                    <div>
                                        <label className="block text-slate-700 mb-1.5">Judul Banner <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="Contoh: Ikan Laut Segar"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 mb-1.5">Subtitle</label>
                                        <input
                                            type="text"
                                            value={formData.subtitle}
                                            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="Contoh: Langsung dari Nelayan"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 mb-1.5">Badge (Label Kecil)</label>
                                        <input
                                            type="text"
                                            value={formData.badge}
                                            onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="Contoh: PROMO SPESIAL"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 text-xs font-semibold">
                                    <div>
                                        <label className="block text-slate-700 mb-1.5">Gambar Banner <span className="text-rose-500">*</span></label>
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
                                                className={`relative aspect-[2/1] border-2 border-dashed rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center bg-slate-50 overflow-hidden group
                                                    ${formData.image ? 'border-blue-200' : 'border-slate-300 hover:border-blue-400'}
                                                    ${isUploading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            >
                                                {formData.image ? (
                                                    <>
                                                        <Image
                                                            src={formData.image}
                                                            alt="Preview"
                                                            fill
                                                            className="object-cover transition-transform group-hover:scale-105"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center border-4 border-white/20">
                                                            <div className="bg-white/90 p-2 rounded-lg flex items-center gap-2 text-slate-800 text-[10px] font-semibold">
                                                                <Upload size={14} />
                                                                Ganti Gambar
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center p-6 text-[10px] font-semibold">
                                                        {isUploading ? (
                                                            <Loader2 className="w-8 h-8 mx-auto text-blue-500 animate-spin mb-2" />
                                                        ) : (
                                                            <ImageIcon className="w-8 h-8 mx-auto text-slate-400 mb-2 group-hover:text-blue-500 transition-colors" />
                                                        )}
                                                        <p className="text-slate-600">
                                                            {isUploading ? 'Mengupload...' : 'Klik untuk upload gambar'}
                                                        </p>
                                                        <p className="text-slate-400 mt-0.5">PNG, JPG, WebP (Maks. 5MB)</p>
                                                    </div>
                                                )}
                                            </div>

                                            <input
                                                type="text"
                                                value={formData.image}
                                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                placeholder="Atau masukkan URL gambar..."
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 mb-1.5 font-semibold">Teks Tombol</label>
                                        <input
                                            type="text"
                                            value={formData.buttonText}
                                            onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="Belanja Sekarang"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 mb-1.5 font-semibold">Link Tujuan</label>
                                        <input
                                            type="text"
                                            value={formData.link}
                                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="/products/category/seafood"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Urutan Tampil</label>
                                    <input
                                        type="number"
                                        value={formData.order}
                                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="flex items-end pb-3">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                                className="sr-only"
                                            />
                                            <div className={`w-10 h-5 rounded-full transition-colors border ${formData.isActive ? 'bg-blue-600 border-blue-600' : 'bg-slate-100 border-slate-300'}`}></div>
                                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${formData.isActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-700">Status Aktif</span>
                                    </label>
                                </div>
                            </div>

                            {/* Live Preview Card */}
                            <div className="mt-4">
                                <label className="block text-xs font-semibold text-slate-700 mb-3">Preview Banner (Live)</label>
                                <div className="relative aspect-[2.5/1] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm group">
                                    {formData.image && (
                                        <Image src={formData.image} alt="Preview" fill className="object-cover transition-opacity duration-300" onError={() => { }} />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex flex-col justify-center p-6">
                                        {formData.badge && (
                                            <span className="bg-orange-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded w-fit mb-1.5">
                                                {formData.badge}
                                            </span>
                                        )}
                                        <h2 className="text-white text-base font-semibold leading-tight mb-0.5">{formData.title || 'Judul Banner Anda'}</h2>
                                        <p className="text-white/80 text-[10px] mb-3 max-w-[60%]">{formData.subtitle || 'Keterangan tambahan...'}</p>
                                        <div className="bg-white text-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-semibold w-fit">
                                            {formData.buttonText || 'Button'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-600 text-sm font-semibold rounded-lg hover:bg-white transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                {editingBanner ? 'Simpan Perubahan' : 'Buat Banner'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
