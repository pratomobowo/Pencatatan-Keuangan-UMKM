'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Plus, Trash2, Camera, Loader2, Save, GripVertical } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';


interface Step {
    content: string;
}

export default function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { addNotification } = useNotifications();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [ingredients, setIngredients] = useState<string[]>([]);
    const [steps, setSteps] = useState<Step[]>([]);
    const [closing, setClosing] = useState('');
    const [image, setImage] = useState<string | null>(null);

    useEffect(() => {
        fetchRecipe();
    }, [id]);

    const fetchRecipe = async () => {
        try {
            const res = await fetch(`/api/shop/recipes/${id}`);
            if (!res.ok) throw new Error('Gagal memuat resep');
            const data = await res.json();

            setTitle(data.title);
            setDescription(data.description || '');

            // Normalize ingredients (handle object array to string array for simplified editing)
            const normalizedIngredients = (data.ingredients || []).map((ing: any) => {
                if (typeof ing === 'object' && ing !== null) {
                    return `${ing.amount || ''} ${ing.item || ''}`.trim();
                }
                return String(ing);
            });
            setIngredients(normalizedIngredients);

            // Normalize steps (handle string array vs object array)
            const normalizedSteps = (data.steps || []).map((step: any) => {
                if (typeof step === 'string') return { content: step };
                return step;
            });
            setSteps(normalizedSteps);

            setClosing(data.closing || '');
            setImage(data.image);
        } catch (error) {
            console.error('Error fetching recipe:', error);
            addNotification('Error', 'Resep tidak ditemukan', 'error');
            router.push('/account/recipes');
        } finally {
            setIsLoading(false);
        }
    };

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
                body: formData,
            });
            if (!res.ok) throw new Error('Upload gagal');
            const data = await res.json();
            setImage(data.url);
        } catch (error) {
            addNotification('Error', 'Gagal upload foto', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const addIngredient = () => {
        setIngredients([...ingredients, '']);
    };

    const updateIngredient = (index: number, value: string) => {
        const newIngredients = [...ingredients];
        newIngredients[index] = value;
        setIngredients(newIngredients);
    };

    const removeIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const addStep = () => {
        setSteps([...steps, { content: '' }]);
    };

    const updateStep = (index: number, value: string) => {
        const newSteps = [...steps];
        newSteps[index] = { content: value };
        setSteps(newSteps);
    };

    const removeStep = (index: number) => {
        setSteps(steps.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            addNotification('Peringatan', 'Judul resep tidak boleh kosong', 'warning');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`/api/shop/recipes/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    ingredients,
                    steps,
                    closing,
                    image
                }),
            });

            if (!res.ok) throw new Error('Gagal update resep');

            addNotification('Berhasil', 'Resep diperbarui dan menunggu moderasi', 'success');
            router.push('/account/recipes');
        } catch (error) {
            console.error('Error updating recipe:', error);
            addNotification('Error', 'Gagal menyimpan perubahan', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4">
                <Loader2 size={40} className="animate-spin text-orange-500" />
                <p className="text-stone-400 font-medium">Menyesuaikan data resep...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 pb-32">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-stone-100">
                <div className="flex items-center px-4 py-3 justify-between">
                    <button onClick={() => router.back()} className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-orange-50">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-stone-900 text-lg font-bold flex-1 text-center pr-10">Edit Resep</h2>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="p-4 max-w-2xl mx-auto space-y-6">
                {/* Photo Section */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 space-y-3">
                    <label className="text-sm font-bold text-stone-900">Foto Hasil Masakan</label>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-stone-100 border-2 border-dashed border-stone-200 group">
                        {image ? (
                            <>
                                <Image src={image} alt="Preview" fill className="object-cover" />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center">
                                    <label className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg text-xs font-bold text-stone-900 cursor-pointer shadow-lg active:scale-95 transition-all">
                                        Ganti Foto
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                </div>
                            </>
                        ) : (
                            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer text-stone-400">
                                {isUploading ? <Loader2 size={32} className="animate-spin text-orange-500" /> : <Camera size={32} />}
                                <span className="text-[10px] font-bold mt-2">{isUploading ? 'Mengunggah...' : 'Tambah Foto Utama'}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        )}
                    </div>
                </div>

                {/* Title & Intro */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-stone-900">Judul Resep</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Contoh: Ayam Goreng Mentega Spesial"
                            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-orange-500 focus:outline-none bg-stone-50/50 text-sm"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-stone-900">Cerita Resep (Intro)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Ceritakan sedikit ttg resep ini..."
                            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-orange-500 focus:outline-none bg-stone-50/50 text-sm resize-none"
                        />
                    </div>
                </div>

                {/* Ingredients Section */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-50">
                        <label className="text-sm font-bold text-stone-900">Bahan-bahan</label>
                        <button
                            type="button"
                            onClick={addIngredient}
                            className="text-white bg-orange-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm shadow-orange-200 active:scale-95 transition-all"
                        >
                            + Tambah
                        </button>
                    </div>
                    <div className="space-y-3">
                        {ingredients.map((ing, idx) => (
                            <div key={idx} className="flex gap-2 items-center animate-in fade-in slide-in-from-right-2 duration-300">
                                <input
                                    type="text"
                                    value={ing}
                                    onChange={(e) => updateIngredient(idx, e.target.value)}
                                    placeholder="Contoh: Bawang 1 ons"
                                    className="flex-1 px-4 py-3 rounded-xl border border-stone-200 focus:border-orange-500 focus:outline-none bg-stone-50/50 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeIngredient(idx)}
                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Steps Section */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-50">
                        <label className="text-sm font-bold text-stone-900">Cara Memasak</label>
                        <button
                            type="button"
                            onClick={addStep}
                            className="text-white bg-orange-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm shadow-orange-200 active:scale-95 transition-all"
                        >
                            + Tambah Step
                        </button>
                    </div>
                    <div className="space-y-4">
                        {steps.map((step, idx) => (
                            <div key={idx} className="flex gap-3 items-start group animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="size-6 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center text-[10px] font-black shrink-0 mt-2">
                                    {idx + 1}
                                </div>
                                <textarea
                                    value={step.content}
                                    onChange={(e) => updateStep(idx, e.target.value)}
                                    rows={2}
                                    placeholder={`Langkah ke-${idx + 1}...`}
                                    className="flex-1 px-4 py-3 rounded-xl border border-stone-200 focus:border-orange-500 focus:outline-none bg-stone-50/50 text-sm resize-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeStep(idx)}
                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors mt-1 opacity-10 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Closing Section */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 space-y-2">
                    <label className="text-sm font-bold text-stone-900">Pesan Penutup (Outro)</label>
                    <input
                        type="text"
                        value={closing}
                        onChange={(e) => setClosing(e.target.value)}
                        placeholder="Contoh: Selamat mencoba Bund!"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-orange-500 focus:outline-none bg-stone-50/50 text-sm"
                    />
                </div>

                {/* Floating Submit Action */}
                <div className="fixed bottom-[72px] left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-stone-100 flex gap-3 z-40">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 bg-stone-100 text-stone-600 font-bold py-3.5 rounded-xl active:scale-95 transition-all"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex-[2] bg-orange-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        <span>Simpan Perubahan</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
