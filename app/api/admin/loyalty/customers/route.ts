import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';

        const customers = await (prisma as any).customer.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { phone: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                ]
            },
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                points: true,
                tier: true,
                totalSpent: true,
                orderCount: true,
                lastOrderDate: true,
            },
            orderBy: {
                totalSpent: 'desc'
            },
            take: 50
        });

        return NextResponse.json(customers);
    } catch (error) {
        console.error('Failed to fetch loyalty customers:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
