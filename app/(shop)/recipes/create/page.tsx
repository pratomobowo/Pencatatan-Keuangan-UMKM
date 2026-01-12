'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Loader2, Sparkles } from 'lucide-react';
import { useShopAuth } from '@/contexts/ShopAuthContext';

export default function CreateRecipePage() {
    const router = useRouter();
    const { customer } = useShopAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState('');
    const [rawInput, setRawInput] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'recipes');

        try {
            const res = await fetch('/api/shop/upload', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setImage(data.url);
            } else {
                alert('Gagal mengupload gambar');
            }
        } catch (error) {
            console.error('Upload failed', error);
            alert('Terjadi kesalahan saat upload');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer) {
            router.push('/login');
            return;
        }

        if (!title.trim() || !rawInput.trim()) {
            alert('Mohon lengkapi judul dan cerita resepnya ya Bun!');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/shop/recipes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    image,
                    rawInput
                })
            });

            if (res.ok) {
                const recipe = await res.json();
                // Redirect to detail page
                router.push(`/recipes/${recipe.slug}`);
            } else {
                alert('Gagal menyimpan resep');
            }
        } catch (error) {
            console.error('Submit failed', error);
            alert('Terjadi kesalahan sistem');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!customer) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-center">
                <Sparkles className="text-orange-500 mb-4" size={48} />
                <h2 className="text-xl font-bold text-stone-900 mb-2">Login Dulu Yuk, Bun!</h2>
                <p className="text-stone-500 mb-6">Biar resepnya bisa disimpan dan dapat poin.</p>
                <button
                    onClick={() => router.push('/login')}
                    className="px-6 py-2 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
                >
                    Login Sekarang
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 pb-24">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white shadow-sm px-4 py-3 flex items-center gap-4">
                <button onClick={() => router.back()} className="text-stone-500 hover:text-orange-500">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="font-bold text-lg text-stone-900">Tulis Resep Baru</h1>
            </div>

            <form onSubmit={handleSubmit} className="p-4 max-w-lg mx-auto space-y-6">
                {/* Image Upload */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative w-full aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden ${image ? 'border-orange-500 bg-stone-900' : 'border-stone-300 hover:border-orange-500 bg-white'}`}
                >
                    {image ? (
                        <>
                            <Image src={image} alt="Preview" fill className="object-cover opacity-80" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                                <span className="text-white font-medium text-sm flex items-center gap-2">
                                    <Upload size={16} /> Ganti Foto
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="text-center p-4">
                            {isUploading ? (
                                <Loader2 className="animate-spin text-orange-500 mx-auto" size={32} />
                            ) : (
                                <>
                                    <Upload className="text-stone-400 mx-auto mb-2" size={32} />
                                    <p className="text-stone-500 font-medium text-sm">Upload Foto Masakan</p>
                                    <p className="text-stone-400 text-xs mt-1">Klik untuk memilih (Max 5MB)</p>
                                </>
                            )}
                        </div>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                    />
                </div>

                {/* Form Inputs */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-stone-900 mb-2">Judul Resep</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Contoh: Sayur Asem Segar ala Bunda"
                            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-orange-500 focus:outline-none bg-white text-stone-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-stone-900 mb-2 flex justify-between">
                            Cerita & Resep
                            <span className="text-orange-500 text-xs font-normal bg-orange-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Sparkles size={10} /> AI Powered
                            </span>
                        </label>
                        <textarea
                            value={rawInput}
                            onChange={(e) => setRawInput(e.target.value)}
                            placeholder="Ceritakan resepmu di sini, Bun! Boleh curhat dikit, terus tulis bahan dan cara masaknya ya. Nanti Minsar yang bantu rapihin formatnya! &#10;&#10;Contoh:&#10;Resep ini favorit si Kakak. Bahannya simpel cuma ayam, bawang, kecap. Cara masaknya tumis bumbu, masukin ayam, kasih kecap..."
                            className="w-full h-64 px-4 py-3 rounded-xl border border-stone-200 focus:border-orange-500 focus:outline-none bg-white text-stone-900 resize-none leading-relaxed"
                        />
                    </div>
                </div>

                {/* Submit */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-100 md:static md:border-0 md:bg-transparent md:p-0">
                    <button
                        type="submit"
                        disabled={isSubmitting || isUploading || !title || !rawInput}
                        className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:shadow-none hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Sedang Meracik...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} />
                                Simpan Resep
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
