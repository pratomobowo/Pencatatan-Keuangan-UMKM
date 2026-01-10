import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
    try {
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch recent orders (last 24 hours) that need attention
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);

        const orders = await prisma.order.findMany({
            where: {
                source: 'ONLINE',
                createdAt: {
                    gte: oneDayAgo
                },
                status: {
                    in: ['PENDING', 'CONFIRMED', 'PREPARING']
                }
            },
            select: {
                id: true,
                orderNumber: true,
                customerName: true,
                grandTotal: true,
                createdAt: true,
                status: true,
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 20 // Limit to 20 most recent
        });

        const notifications = orders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName || 'Customer',
            grandTotal: Number(order.grandTotal),
            createdAt: order.createdAt.toISOString(),
            status: order.status,
        }));

        return NextResponse.json(notifications);
    } catch (error) {
        console.error('Error fetching order notifications:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
