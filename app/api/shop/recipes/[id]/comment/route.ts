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

// POST /api/shop/recipes/[id]/comment
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } // Fix for Next.js 15
) {
    try {
        const identity = await getCustomerIdentity(request);
        if (!identity) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await context.params;
        const recipeId = params.id;
        const body = await request.json();
        const { content } = body;

        if (!content || !content.trim()) {
            return NextResponse.json({ error: 'Comment must not be empty' }, { status: 400 });
        }

        // Check if recipe exists
        const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
        if (!recipe) {
            return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
        }

        const comment = await prisma.recipeComment.create({
            data: {
                content,
                recipeId,
                customerId: identity.userId
            },
            include: {
                customer: {
                    select: { name: true }
                }
            }
        });

        return NextResponse.json(comment);

    } catch (error) {
        console.error('Error posting comment:', error);
        return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
    }
}
