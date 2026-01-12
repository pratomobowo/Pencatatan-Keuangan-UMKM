import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { auth } from '@/lib/auth';
import { getJwtSecret } from '@/lib/jwt';

const JWT_SECRET = getJwtSecret();

async function getCustomerIdentity(request: NextRequest) {
    const token = request.cookies.get('shop-token')?.value;
    if (token) {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            return payload as { userId: string; identifier: string };
        } catch { }
    }
    const session = await auth();
    if (session?.user?.email) {
        const customer = await prisma.customer.findFirst({
            where: { email: session.user.email }
        });
        if (customer) {
            return { userId: customer.id, identifier: session.user.email };
        }
    }
    return null;
}

// GET /api/shop/recipes/[id] (Handles both slug and UUID)
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const identity = await getCustomerIdentity(request);

        // Find by slug OR id (if id looks like UUID)
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        const recipe = await prisma.recipe.findFirst({
            where: isUuid ? { id: id } : { slug: id },
            include: {
                author: {
                    select: { name: true }
                },
                _count: {
                    select: { likes: true, comments: true }
                },
                comments: {
                    include: {
                        customer: { select: { name: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!recipe) {
            return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
        }

        // Increment view count (fire and forget)
        prisma.recipe.update({
            where: { id: recipe.id },
            data: { views: { increment: 1 } }
        }).catch(console.error);

        // Check if current user liked it
        let isLiked = false;
        if (identity) {
            const like = await prisma.recipeLike.findUnique({
                where: {
                    recipeId_customerId: {
                        recipeId: recipe.id,
                        customerId: identity.userId
                    }
                }
            });
            isLiked = !!like;
        }

        return NextResponse.json({ ...recipe, isLiked });
    } catch (error) {
        console.error('Error fetching recipe detail:', error);
        return NextResponse.json({ error: 'Failed to fetch recipe' }, { status: 500 });
    }
}

// PATCH /api/shop/recipes/[id] (Update by author)
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const identity = await getCustomerIdentity(request);
        if (!identity) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;
        const body = await request.json();
        const { title, description, ingredients, steps, closing, image } = body;

        // Find the recipe first to check ownership
        const recipe = await prisma.recipe.findUnique({
            where: { id: id }
        });

        if (!recipe) {
            return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
        }

        if (recipe.authorId !== identity.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update the recipe
        // We reset status to PENDING so admin can review the edit
        const updatedRecipe = await prisma.recipe.update({
            where: { id: id },
            data: {
                title,
                description,
                ingredients: ingredients || [],
                steps: steps || [],
                closing,
                image,
                status: 'PENDING',
                updatedAt: new Date()
            }
        });

        return NextResponse.json(updatedRecipe);

    } catch (error) {
        console.error('Error updating recipe:', error);
        return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 });
    }
}
