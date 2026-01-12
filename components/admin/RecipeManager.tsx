'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, Check, X, Eye, ChefHat, AlertCircle } from 'lucide-react';

interface Recipe {
    id: string;
    title: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    image: string | null;
    description: string | null;
    ingredients: string[];
    steps: string[];
    rawInput: string | null;
    author: {
        name: string;
        email: string | null;
    };
    createdAt: string;
}

export const RecipeManager = () => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchRecipes = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/recipes?status=${filter}&limit=50`);
            if (res.ok) {
                const data = await res.json();
                setRecipes(data.recipes);
            }
        } catch (error) {
            console.error('Failed to fetch recipes', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes();
    }, [filter]);

    const handleUpdateStatus = async (status: 'APPROVED' | 'REJECTED') => {
        if (!selectedRecipe) return;
        setIsProcessing(true);

        try {
            const res = await fetch(`/api/admin/recipes/${selectedRecipe.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                // Refresh list
                fetchRecipes();
                setSelectedRecipe(null);
            } else {
                alert('Gagal update status');
            }
        } catch (error) {
            console.error('Update failed', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                    <ChefHat className="text-orange-500" />
                    Manajemen Resep
                </h2>
                <div className="flex bg-stone-100 p-1 rounded-lg">
                    {['PENDING', 'APPROVED', 'REJECTED'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${filter === f ? 'bg-white shadow text-orange-600' : 'text-stone-500 hover:text-stone-700'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-500">
                        <tr>
                            <th className="p-4 font-semibold">Resep</th>
                            <th className="p-4 font-semibold">Penulis</th>
                            <th className="p-4 font-semibold">Tanggal</th>
                            <th className="p-4 font-semibold text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center">
                                    <Loader2 className="animate-spin mx-auto text-orange-500" />
                                </td>
                            </tr>
                        ) : recipes.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-stone-400">
                                    Tidak ada data resep {filter.toLowerCase()}
                                </td>
                            </tr>
                        ) : (
                            recipes.map((recipe) => (
                                <tr key={recipe.id} className="hover:bg-stone-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-lg bg-stone-100 relative overflow-hidden shrink-0">
                                                <Image src={recipe.image || '/images/recipe-create-placeholder.jpg'} alt={recipe.title} fill className="object-cover" />
                                            </div>
                                            <span className="font-medium text-stone-900 line-clamp-1">{recipe.title}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-stone-600">
                                        {recipe.author.name}
                                        <br />
                                        <span className="text-xs text-stone-400">{recipe.author.email || '-'}</span>
                                    </td>
                                    <td className="p-4 text-stone-500 text-xs">
                                        {new Date(recipe.createdAt).toLocaleDateString('id-ID')}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => setSelectedRecipe(recipe)}
                                            className="px-3 py-1.5 bg-sky-50 text-sky-600 rounded-lg text-xs font-semibold hover:bg-sky-100 transition-colors"
                                        >
                                            Review
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Detail Modal */}
            {selectedRecipe && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                            <div>
                                <h3 className="text-lg font-bold text-stone-900">{selectedRecipe.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${selectedRecipe.status === 'PENDING' ? 'bg-orange-100 text-orange-600' :
                                            selectedRecipe.status === 'APPROVED' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                        }`}>
                                        {selectedRecipe.status}
                                    </span>
                                    <span className="text-xs text-stone-400">by {selectedRecipe.author.name}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedRecipe(null)} className="text-stone-400 hover:text-stone-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-8">
                            {/* Left: AI Parsed Results */}
                            <div className="space-y-6">
                                <h4 className="font-bold text-stone-900 border-b pb-2 flex items-center gap-2">
                                    <Sparkles size={16} className="text-orange-500" /> Hasil Format AI
                                </h4>

                                <div className="space-y-4">
                                    <div className="bg-stone-50 p-3 rounded-lg">
                                        <p className="text-xs font-semibold text-stone-500 mb-1">Intro</p>
                                        <p className="text-sm italic text-stone-700">{selectedRecipe.description || '-'}</p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold text-stone-500 mb-2">Bahan-bahan</p>
                                        <ul className="text-sm text-stone-700 list-disc ml-4 space-y-1">
                                            {selectedRecipe.ingredients.map((i, idx) => (
                                                <li key={idx}>{i}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold text-stone-500 mb-2">Cara Membuat</p>
                                        <ol className="text-sm text-stone-700 list-decimal ml-4 space-y-2">
                                            {selectedRecipe.steps.map((s, idx) => (
                                                <li key={idx}>{s}</li>
                                            ))}
                                        </ol>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Raw Input & Actions */}
                            <div className="flex flex-col h-full">
                                <h4 className="font-bold text-stone-900 border-b pb-2 mb-4">Input Mentah</h4>
                                <div className="flex-1 bg-stone-50 p-4 rounded-xl border border-stone-200 text-sm whitespace-pre-wrap font-mono text-stone-600 overflow-y-auto max-h-[400px]">
                                    {selectedRecipe.rawInput}
                                </div>

                                <div className="mt-6 pt-6 border-t border-stone-100 flex gap-3">
                                    {selectedRecipe.status === 'PENDING' && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus('REJECTED')}
                                                disabled={isProcessing}
                                                className="flex-1 py-3 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <X size={18} /> Tolak
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus('APPROVED')}
                                                disabled={isProcessing}
                                                className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                                            >
                                                {isProcessing ? <Loader2 className="animate-spin" /> : <Check size={18} />}
                                                Setujui & Beri Poin
                                            </button>
                                        </>
                                    )}
                                    {selectedRecipe.status !== 'PENDING' && (
                                        <div className="w-full text-center p-3 bg-stone-100 rounded-xl text-stone-500 font-medium">
                                            Status: {selectedRecipe.status}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

function Sparkles({ size, className }: { size?: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
    );
}
