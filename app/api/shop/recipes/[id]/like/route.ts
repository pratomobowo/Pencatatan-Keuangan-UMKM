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

// POST /api/shop/recipes/[id]/like
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const identity = await getCustomerIdentity(request);
        if (!identity) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await context.params;
        const recipeId = params.id;

        // Check if recipe exists
        const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
        if (!recipe) {
            return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
        }

        // Toggle Like
        const existingLike = await prisma.recipeLike.findUnique({
            where: {
                recipeId_customerId: {
                    recipeId,
                    customerId: identity.userId
                }
            }
        });

        if (existingLike) {
            await prisma.recipeLike.delete({
                where: { id: existingLike.id }
            });
            return NextResponse.json({ liked: false });
        } else {
            await prisma.recipeLike.create({
                data: {
                    recipeId,
                    customerId: identity.userId
                }
            });
            return NextResponse.json({ liked: true });
        }

    } catch (error) {
        console.error('Error toggling like:', error);
        return NextResponse.json({ error: 'Failed to like recipe' }, { status: 500 });
    }
}
