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
            return { userId: payload.userId as string, identifier: payload.identifier as string };
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

export async function GET(request: NextRequest) {
    try {
        const identity = await getCustomerIdentity(request);
        if (!identity) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const recipes = await prisma.recipe.findMany({
            where: {
                authorId: identity.userId
            },
            include: {
                _count: {
                    select: { likes: true, comments: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip,
            take: limit
        });

        const total = await prisma.recipe.count({
            where: {
                authorId: identity.userId
            }
        });

        return NextResponse.json({
            recipes,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching my recipes:', error);
        return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
    }
}
