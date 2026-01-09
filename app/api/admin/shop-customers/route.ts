import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Force dynamic to prevent static generation issues with auth
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const customers = await prisma.shopCustomer.findMany({
            include: {
                _count: {
                    select: { orders: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(customers);
    } catch (error) {
        console.error('Error fetching shop customers:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
