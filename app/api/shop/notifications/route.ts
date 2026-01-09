import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { auth } from '@/lib/auth';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'shop-customer-secret-key-change-in-production'
);

// Helper to get customer identity from token or NextAuth session
async function getCustomerIdentity(request: NextRequest) {
    // 1. Try custom shop-token first (priority for direct shop login)
    const token = request.cookies.get('shop-token')?.value;

    if (token) {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            return payload as { userId: string; identifier: string; type: string };
        } catch {
            // Fall through to NextAuth check
        }
    }

    // 2. Try NextAuth session (for Google/Credentials login)
    const session = await auth();
    if (session?.user?.email) {
        return {
            userId: (session.user as any).id,
            identifier: session.user.email,
            type: 'next-auth'
        };
    }

    return null;
}

// GET /api/shop/notifications - List customer notifications
export async function GET(request: NextRequest) {
    try {
        const tokenData = await getCustomerIdentity(request);

        if (!tokenData) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find customer record to get the correct customerId for notifications
        const customer = await prisma.customer.findFirst({
            where: {
                OR: [
                    { id: tokenData.userId },
                    { email: tokenData.identifier }
                ]
            } as any
        });

        if (!customer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            );
        }

        const notifications = await (prisma as any).notification.findMany({
            where: { customerId: customer.id },
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
        const tokenData = await getCustomerIdentity(request);

        if (!tokenData) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find customer record to get the correct customerId for notifications
        const customer = await prisma.customer.findFirst({
            where: {
                OR: [
                    { id: tokenData.userId },
                    { email: tokenData.identifier }
                ]
            } as any
        });

        if (!customer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            );
        }

        const { ids } = await request.json();

        if (!ids || !Array.isArray(ids)) {
            // Mark all as read if no ids provided
            await (prisma as any).notification.updateMany({
                where: { customerId: customer.id, isRead: false },
                data: { isRead: true }
            });
        } else {
            await (prisma as any).notification.updateMany({
                where: {
                    customerId: customer.id,
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
