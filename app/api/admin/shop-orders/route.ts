import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
    try {
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const orders = await prisma.order.findMany({
            where: {
                source: 'ONLINE'
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                    }
                },
                items: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error('Error fetching shop orders:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
