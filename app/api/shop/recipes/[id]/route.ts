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
        return { userId: (session.user as any).id, identifier: session.user.email };
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
