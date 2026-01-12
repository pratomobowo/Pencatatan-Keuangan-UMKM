'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RecipeCard } from '@/components/shop/RecipeCard';
import { Plus, ChefHat, Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Recipe {
    id: string;
    title: string;
    slug: string;
    image: string | null;
    description: string | null;
    author: {
        name: string;
    };
    _count: {
        likes: number;
        comments: number;
    };
}

export default function RecipesPage() {
    const router = useRouter();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchRecipes = async (pageNum: number) => {
        try {
            const res = await fetch(`/api/shop/recipes?page=${pageNum}&limit=12`);
            if (res.ok) {
                const data = await res.json();
                if (pageNum === 1) {
                    setRecipes(data.recipes);
                } else {
                    setRecipes(prev => [...prev, ...data.recipes]);
                }
                setHasMore(data.recipes.length === 12);
            }
        } catch (error) {
            console.error('Failed to fetch recipes', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes(1);
    }, []);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchRecipes(nextPage);
    };

    return (
        <div className="min-h-screen bg-stone-50 pb-24">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md shadow-sm border-b border-stone-100 p-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-stone-500 hover:text-orange-500 transition-colors">
                        <ArrowLeft size={24} />
                    </button> // Added back button for mobile nav override
                    <div className="flex-1">
                        <h1 className="font-bold text-lg text-stone-900 flex items-center gap-2">
                            <ChefHat className="text-orange-500" size={24} />
                            Buku Resep
                        </h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 max-w-2xl mx-auto">
                {isLoading && recipes.length === 0 ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-orange-500" size={32} />
                    </div>
                ) : recipes.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                        {recipes.map((recipe) => (
                            <RecipeCard key={recipe.id} recipe={recipe} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <ChefHat className="mx-auto text-stone-300 mb-4" size={48} />
                        <p className="text-stone-500">Belum ada resep. Jadilah yang pertama!</p>
                    </div>
                )}

                {/* Load More */}
                {recipes.length > 0 && hasMore && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={handleLoadMore}
                            className="px-6 py-2 bg-white border border-stone-200 rounded-full text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors shadow-sm"
                        >
                            Muat Lebih Banyak
                        </button>
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            <Link
                href="/recipes/create"
                className="fixed bottom-20 right-4 size-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg shadow-orange-500/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-40"
            >
                <Plus size={28} />
            </Link>
        </div>
    );
}
