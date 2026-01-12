'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, BookOpen, Clock, CheckCircle2, AlertCircle, ChevronRight, Loader2, Edit3 } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

interface Recipe {
    id: string;
    title: string;
    slug: string;
    image: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    _count: {
        likes: number;
        comments: number;
    }
}

export default function AccountRecipesPage() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addNotification } = useNotifications();

    useEffect(() => {
        fetchMyRecipes();
    }, []);

    const fetchMyRecipes = async () => {
        try {
            const res = await fetch('/api/shop/recipes/me');
            if (!res.ok) throw new Error('Gagal mengambil data resep');
            const data = await res.json();
            setRecipes(data.recipes);
        } catch (error) {
            console.error('Error fetching recipes:', error);
            addNotification('Error', 'Gagal memuat daftar resep', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: Recipe['status']) => {
        switch (status) {
            case 'APPROVED':
                return (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={12} />
                        <span>DISETUJUI</span>
                    </div>
                );
            case 'REJECTED':
                return (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                        <AlertCircle size={12} />
                        <span>DITOLAK</span>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                        <Clock size={12} />
                        <span>MENUNGGU</span>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-stone-100">
                <div className="flex items-center px-4 py-3 justify-between">
                    <Link href="/account" className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-orange-50">
                        <ArrowLeft size={24} />
                    </Link>
                    <h2 className="text-stone-900 text-lg font-bold flex-1 text-center pr-10">Resep Saya</h2>
                </div>
            </header>

            <div className="p-4 flex flex-col gap-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="animate-spin text-orange-500" size={32} />
                        <p className="text-stone-400 text-sm">Memuat resep...</p>
                    </div>
                ) : recipes.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 flex flex-col items-center text-center shadow-sm border border-stone-100">
                        <div className="size-20 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mb-6">
                            <BookOpen size={40} />
                        </div>
                        <h3 className="text-lg font-bold text-stone-900 mb-2">Belum ada resep</h3>
                        <p className="text-stone-500 text-sm mb-8">Wah, Ayuk sharing resep favorit Bunda sekarang!</p>
                        <Link
                            href="/recipes/create"
                            className="bg-orange-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-orange-200 active:scale-95 transition-all"
                        >
                            Tulis Resep Pertama
                        </Link>
                    </div>
                ) : (
                    recipes.map((recipe) => (
                        <div key={recipe.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 flex h-32">
                            {/* Image Container */}
                            <div className="relative w-32 h-full bg-stone-100 shrink-0">
                                {recipe.image ? (
                                    <Image
                                        src={recipe.image}
                                        alt={recipe.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                                        <BookOpen size={24} />
                                    </div>
                                )}
                            </div>

                            {/* Info Container */}
                            <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                                <div>
                                    <div className="flex justify-between items-start gap-2 mb-1">
                                        {getStatusBadge(recipe.status)}
                                        <span className="text-[10px] text-stone-400 font-medium">
                                            {new Date(recipe.createdAt).toLocaleDateString('id-ID')}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-stone-900 text-sm line-clamp-2 leading-tight">
                                        {recipe.title}
                                    </h3>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-[10px] text-stone-500">
                                        <span>{recipe._count.likes} Suka</span>
                                        <span>{recipe._count.comments} Komentar</span>
                                    </div>
                                    <Link
                                        href={`/account/recipes/${recipe.id}/edit`}
                                        className="size-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-100 transition-colors"
                                    >
                                        <Edit3 size={16} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
