import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCustomerFromToken } from '@/lib/shop-auth';

// GET /api/shop/notifications - List customer notifications
export async function GET(request: NextRequest) {
    try {
        const tokenData = await getCustomerFromToken(request);

        if (!tokenData) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const notifications = await prisma.notification.findMany({
            where: { customerId: tokenData.userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return NextResponse.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Gagal mengambil notifikasi' }, { status: 500 });
    }
}

// PUT /api/shop/notifications - Mark notifications as read
export async function PUT(request: NextRequest) {
    try {
        const tokenData = await getCustomerFromToken(request);

        if (!tokenData) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { ids } = await request.json();

        if (!ids || !Array.isArray(ids)) {
            // Mark all as read if no ids provided
            await prisma.notification.updateMany({
                where: { customerId: tokenData.userId, isRead: false },
                data: { isRead: true }
            });
        } else {
            await prisma.notification.updateMany({
                where: {
                    customerId: tokenData.userId,
                    id: { in: ids }
                },
                data: { isRead: true }
            });
        }

        return NextResponse.json({ message: 'Notifications updated' });
    } catch (error) {
        console.error('Error updating notifications:', error);
        return NextResponse.json({ error: 'Gagal memperbarui notifikasi' }, { status: 500 });
    }
}
