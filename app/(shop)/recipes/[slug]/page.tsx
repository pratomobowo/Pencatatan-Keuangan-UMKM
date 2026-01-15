import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import RecipeDetailClient from './RecipeDetailClient';

interface RecipePageProps {
    params: Promise<{ slug: string }>;
}

async function getRecipe(slug: string) {
    const recipe = await (prisma as any).recipe.findFirst({
        where: {
            slug,
            status: 'APPROVED',
        },
        include: {
            author: { select: { name: true } },
            comments: {
                include: { customer: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
            },
            _count: { select: { likes: true, comments: true } },
        },
    });

    return recipe;
}

export async function generateMetadata({ params }: RecipePageProps): Promise<Metadata> {
    const { slug } = await params;
    const recipe = await getRecipe(slug);

    if (!recipe) {
        return {
            title: 'Resep Tidak Ditemukan',
            description: 'Resep yang Anda cari tidak ditemukan.',
        };
    }

    const description = recipe.description?.slice(0, 160) || `Resep ${recipe.title} dari PasarAntar. Bahan dan cara membuat lengkap.`;

    return {
        title: `Resep ${recipe.title}`,
        description,
        openGraph: {
            title: `Resep ${recipe.title}`,
            description,
            url: `https://pasarantar.id/recipes/${recipe.slug}`,
            siteName: 'PasarAntar',
            images: recipe.image ? [
                {
                    url: recipe.image,
                    width: 800,
                    height: 600,
                    alt: recipe.title,
                }
            ] : [],
            type: 'article',
            locale: 'id_ID',
        },
        alternates: {
            canonical: `https://pasarantar.id/recipes/${recipe.slug}`,
        },
    };
}

export default async function RecipeDetailPage({ params }: RecipePageProps) {
    const { slug } = await params;
    const recipe = await getRecipe(slug);

    if (!recipe) {
        notFound();
    }

    // JSON-LD Recipe Schema
    const recipeJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Recipe',
        name: recipe.title,
        image: recipe.image ? [recipe.image] : [],
        author: {
            '@type': 'Person',
            name: recipe.author.name,
        },
        description: recipe.description,
        recipeIngredient: recipe.ingredients,
        recipeInstructions: (recipe.steps as any[]).map((step, idx) => ({
            '@type': 'HowToStep',
            position: idx + 1,
            text: typeof step === 'string' ? step : step.content,
        })),
        aggregateRating: recipe._count.likes > 0 ? {
            '@type': 'AggregateRating',
            ratingValue: 5,
            ratingCount: recipe._count.likes,
        } : undefined,
    };

    // Transform for client
    const recipeData = {
        id: recipe.id,
        title: recipe.title,
        slug: recipe.slug,
        image: recipe.image,
        description: recipe.description,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        closing: recipe.closing,
        author: recipe.author,
        views: recipe.views,
        _count: recipe._count,
        isLiked: false, // Will be determined client-side
        comments: recipe.comments.map((c: any) => ({
            id: c.id,
            content: c.content,
            createdAt: c.createdAt.toISOString(),
            customer: c.customer,
        })),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeJsonLd) }}
            />
            <RecipeDetailClient recipe={recipeData} />
        </>
    );
}
