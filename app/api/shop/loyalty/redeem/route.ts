import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from 'next-auth/react'; // Need to check how shop auth is handled
import { auth } from '@/lib/auth'; // Using common auth

// POST /api/shop/loyalty/redeem - Redeem points for a reward
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { rewardId } = data;

        const customer = await (prisma as any).customer.findUnique({
            where: { email: session.user.email }
        });

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        const reward = await (prisma as any).loyaltyReward.findUnique({
            where: { id: rewardId, isActive: true }
        });

        if (!reward) {
            return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
        }

        if (customer.points < reward.pointsCost) {
            return NextResponse.json({ error: 'Poin tidak mencukupi' }, { status: 400 });
        }

        // Generate a random unique code
        const voucherCode = `RW-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.floor(Date.now() / 1000).toString().slice(-4)}`;

        // Transaction for redemption
        const result = await prisma.$transaction([
            // 1. Deduct points
            (prisma as any).customer.update({
                where: { id: customer.id },
                data: { points: { decrement: reward.pointsCost } }
            }),
            // 2. Log point transaction
            (prisma as any).pointTransaction.create({
                data: {
                    customerId: customer.id,
                    amount: -reward.pointsCost,
                    description: `Redeem hadiah: ${reward.title}`,
                    type: 'SPENT'
                }
            }),
            // 3. Create Voucher
            (prisma as any).voucher.create({
                data: {
                    code: voucherCode,
                    customerId: customer.id,
                    type: reward.type,
                    value: reward.value,
                    productId: reward.productId,
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Valid for 30 days
                }
            })
        ]);

        return NextResponse.json({
            message: 'Berhasil menukarkan poin',
            voucher: result[2]
        });

    } catch (error) {
        console.error('Error redeeming loyalty reward:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
