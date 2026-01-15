'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, MessageCircle, Send, User as UserIcon, ChefHat } from 'lucide-react';
import { useShopAuth } from '@/contexts/ShopAuthContext';

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    customer: {
        name: string;
    };
}

interface RecipeDetail {
    id: string;
    title: string;
    slug: string;
    image: string | null;
    description: string | null;
    ingredients: string[];
    steps: string[];
    closing: string | null;
    author: {
        name: string;
    };
    views: number;
    _count: {
        likes: number;
        comments: number;
    };
    isLiked: boolean;
    comments: Comment[];
}

interface RecipeDetailClientProps {
    recipe: RecipeDetail;
}

export default function RecipeDetailClient({ recipe: initialRecipe }: RecipeDetailClientProps) {
    const router = useRouter();
    const { customer } = useShopAuth();

    const [recipe, setRecipe] = useState<RecipeDetail>(initialRecipe);
    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    const handleLike = async () => {
        if (!customer) {
            alert('Silakan login untuk menyukai resep ini.');
            return;
        }

        const previousLiked = recipe.isLiked;
        const previousCount = recipe._count.likes;

        setRecipe(prev => ({
            ...prev,
            isLiked: !prev.isLiked,
            _count: { ...prev._count, likes: prev.isLiked ? prev._count.likes - 1 : prev._count.likes + 1 }
        }));

        try {
            const res = await fetch(`/api/shop/recipes/${recipe.id}/like`, { method: 'POST' });
            if (!res.ok) throw new Error();
        } catch {
            setRecipe(prev => ({
                ...prev,
                isLiked: previousLiked,
                _count: { ...prev._count, likes: previousCount }
            }));
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer) {
            alert('Silakan login untuk berkomentar.');
            return;
        }
        if (!commentText.trim()) return;

        setIsSubmittingComment(true);
        try {
            const res = await fetch(`/api/shop/recipes/${recipe.id}/comment`, {
                method: 'POST',
                body: JSON.stringify({ content: commentText }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                const newComment = await res.json();
                setRecipe(prev => ({
                    ...prev,
                    comments: [newComment, ...prev.comments],
                    _count: { ...prev._count, comments: prev._count.comments + 1 }
                }));
                setCommentText('');
            }
        } catch (error) {
            console.error('Failed to post comment', error);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    return (
        <div className="min-h-screen bg-white pb-24">
            {/* Hero Image */}
            <div className="relative aspect-[4/3] w-full bg-stone-100">
                <Image
                    src={recipe.image || '/images/recipe-placeholder.jpg'}
                    alt={recipe.title}
                    fill
                    className="object-cover"
                    priority
                />
                <button
                    onClick={() => router.back()}
                    className="absolute top-4 left-4 size-10 bg-white/50 backdrop-blur-md rounded-full flex items-center justify-center text-stone-900 shadow-sm hover:bg-white transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
            </div>

            <div className="max-w-2xl mx-auto -mt-6 relative bg-white rounded-t-3xl px-6 pt-8 pb-10 shadow-sm">
                <h1 className="text-2xl font-bold text-stone-900 mb-2">{recipe.title}</h1>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="size-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                            <ChefHat size={16} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-stone-900">{recipe.author.name}</p>
                            <p className="text-[10px] text-stone-500">{new Date().toLocaleDateString('id-ID')}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleLike}
                            className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${recipe.isLiked ? 'text-red-500' : 'text-stone-400'}`}
                        >
                            <Heart size={24} fill={recipe.isLiked ? 'currentColor' : 'none'} />
                            <span className="text-[10px] font-medium">{recipe._count.likes}</span>
                        </button>
                        <button className="flex flex-col items-center justify-center gap-0.5 text-stone-400">
                            <MessageCircle size={24} />
                            <span className="text-[10px] font-medium">{recipe._count.comments}</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Pembukaan */}
                    <div className="prose prose-sm prose-stone">
                        <p className="font-serif italic text-stone-600 bg-orange-50/50 p-4 rounded-xl border border-orange-100/50 leading-relaxed">
                            "{recipe.description}"
                        </p>
                    </div>

                    {/* Bahan */}
                    <div>
                        <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
                            <span className="size-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs">🥕</span>
                            Bahan-bahan
                        </h3>
                        <ul className="space-y-3">
                            {(recipe.ingredients as any[]).map((ing, idx) => (
                                <li key={idx} className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl">
                                    <div className="size-1.5 mt-2 rounded-full bg-orange-400 shrink-0" />
                                    <span className="text-stone-700 text-sm">
                                        {typeof ing === 'string' ? ing : `${ing.amount || ''} ${ing.item}`.trim()}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Cara Masak */}
                    <div>
                        <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
                            <span className="size-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs">🍳</span>
                            Cara Membuat
                        </h3>
                        <div className="space-y-6 relative border-l-2 border-orange-100 ml-3 pl-6 pb-2">
                            {(recipe.steps as any[]).map((step, idx) => (
                                <div key={idx} className="relative">
                                    <span className="absolute -left-[31px] top-0 size-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm">
                                        {idx + 1}
                                    </span>
                                    <p className="text-stone-700 text-sm leading-relaxed">
                                        {typeof step === 'string' ? step : step.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Penutupan */}
                    {recipe.closing && (
                        <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white p-6 rounded-2xl text-center shadow-lg shadow-orange-500/20">
                            <p className="font-medium text-lg mb-1">Coba Resep Ini Yuk, Bun!</p>
                            <p className="text-white/90 text-sm italic">{recipe.closing}</p>
                        </div>
                    )}
                </div>

                {/* Comments Section */}
                <div className="mt-12 pt-8 border-t border-stone-100">
                    <h3 className="text-lg font-bold text-stone-900 mb-6">Komentar ({recipe.comments.length})</h3>

                    {customer ? (
                        <form onSubmit={handleComment} className="flex gap-3 mb-8">
                            <div className="size-8 rounded-full bg-stone-100 overflow-hidden relative shrink-0">
                                <div className="w-full h-full bg-orange-100" />
                            </div>
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Tulis komentar..."
                                    className="w-full bg-stone-50 border border-transparent focus:bg-white focus:border-orange-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all pr-12"
                                    disabled={isSubmittingComment}
                                />
                                <button
                                    type="submit"
                                    disabled={!commentText.trim() || isSubmittingComment}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-orange-500 hover:bg-orange-50 rounded-full disabled:opacity-50"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="mb-8 p-4 bg-stone-50 rounded-xl text-center">
                            <Link href="/login" className="text-orange-500 font-medium text-sm hover:underline">
                                Login untuk berkomentar
                            </Link>
                        </div>
                    )}

                    <div className="space-y-6">
                        {recipe.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                                <div className="size-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 shrink-0">
                                    <UserIcon size={16} />
                                </div>
                                <div>
                                    <div className="bg-stone-50 rounded-2xl rounded-tl-none px-4 py-2">
                                        <p className="text-xs font-bold text-stone-900 mb-0.5">{comment.customer.name}</p>
                                        <p className="text-xs text-stone-600">{comment.content}</p>
                                    </div>
                                    <p className="text-[10px] text-stone-400 mt-1 ml-2">
                                        {new Date(comment.createdAt).toLocaleDateString('id-ID')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
