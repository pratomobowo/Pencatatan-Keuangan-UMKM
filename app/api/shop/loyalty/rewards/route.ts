import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/shop/loyalty/rewards - List active rewards for customers
export async function GET() {
    try {
        const rewards = await (prisma as any).loyaltyReward.findMany({
            where: { isActive: true },
            orderBy: { pointsCost: 'asc' },
            include: { product: true }
        });

        return NextResponse.json(rewards);
    } catch (error) {
        console.error('Error fetching loyalty rewards:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
