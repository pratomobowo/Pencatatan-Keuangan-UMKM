'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, ChefHat } from 'lucide-react';

interface RecipeCardProps {
    recipe: {
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
    };
}

export const RecipeCard = ({ recipe }: RecipeCardProps) => {
    return (
        <Link href={`/recipes/${recipe.slug || recipe.id}`} className="block group">
            <div className="bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-md transition-all">
                {/* Image */}
                <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                    <Image
                        src={recipe.image || '/images/recipe-placeholder.jpg'}
                        alt={recipe.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />

                    {/* Author overlay */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <div className="size-6 rounded-full bg-white/20 backdrop-blur-sm overflow-hidden border border-white/50 flex items-center justify-center">
                            <ChefHat size={12} className="text-white" />
                        </div>
                        <span className="text-white text-xs font-medium truncate max-w-[120px]">
                            {recipe.author.name}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    <h3 className="font-semibold text-stone-900 group-hover:text-orange-600 transition-colors line-clamp-2 mb-1">
                        {recipe.title}
                    </h3>
                    <p className="text-stone-500 text-xs line-clamp-2 leading-relaxed mb-3">
                        {recipe.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-stone-400 text-xs">
                        <div className="flex items-center gap-1">
                            <Heart size={14} />
                            <span>{recipe._count.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <MessageCircle size={14} />
                            <span>{recipe._count.comments}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};
