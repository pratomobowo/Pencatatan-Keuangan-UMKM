import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/admin/loyalty/rewards - List all rewards
export async function GET() {
    try {
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rewards = await (prisma as any).loyaltyReward.findMany({
            orderBy: { createdAt: 'desc' },
            include: { product: true }
        });

        return NextResponse.json(rewards);
    } catch (error) {
        console.error('Error fetching loyalty rewards:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/admin/loyalty/rewards - Create new reward
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { title, description, image, pointsCost, type, value, productId, isActive } = data;

        const reward = await (prisma as any).loyaltyReward.create({
            data: {
                title,
                description,
                image,
                pointsCost: Number(pointsCost),
                type,
                value: value ? Number(value) : null,
                productId,
                isActive: isActive !== false
            }
        });

        return NextResponse.json(reward);
    } catch (error) {
        console.error('Error creating loyalty reward:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
