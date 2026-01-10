import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// PATCH /api/admin/loyalty/rewards/[id] - Update reward
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { title, description, image, pointsCost, type, value, productId, isActive } = data;

        const reward = await (prisma as any).loyaltyReward.update({
            where: { id },
            data: {
                title,
                description,
                image,
                pointsCost: pointsCost ? Number(pointsCost) : undefined,
                type,
                value: value !== undefined ? (value ? Number(value) : null) : undefined,
                productId,
                isActive
            }
        });

        return NextResponse.json(reward);
    } catch (error) {
        console.error('Error updating loyalty reward:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE /api/admin/loyalty/rewards/[id] - Delete reward
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await (prisma as any).loyaltyReward.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Reward deleted' });
    } catch (error) {
        console.error('Error deleting loyalty reward:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
