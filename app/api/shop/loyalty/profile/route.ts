import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/shop/loyalty/profile - Get customer loyalty data
export async function GET() {
    try {
        const session = await auth();
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const customer = await (prisma as any).customer.findUnique({
            where: { email: session.user.email },
            include: {
                pointTransactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                },
                vouchers: {
                    where: { isUsed: false },
                    orderBy: { createdAt: 'desc' },
                    include: { product: true }
                }
            }
        });

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        return NextResponse.json({
            points: customer.points,
            tier: customer.tier,
            totalSpent: Number(customer.totalSpent),
            transactions: customer.pointTransactions,
            vouchers: customer.vouchers
        });

    } catch (error) {
        console.error('Error fetching loyalty profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
