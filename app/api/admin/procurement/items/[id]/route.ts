import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// PATCH - Update procurement item (costPrice, isPurchased, notes)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !['admin', 'user'].includes((session.user as any)?.role || '')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { costPrice, isPurchased, notes } = await request.json();

        const updated = await prisma.procurementItem.update({
            where: { id },
            data: {
                ...(costPrice !== undefined && { costPrice: costPrice ? parseFloat(costPrice) : null }),
                ...(isPurchased !== undefined && { isPurchased }),
                ...(notes !== undefined && { notes })
            }
        });

        // Recalculate session totalCost
        const sessionItems = await prisma.procurementItem.findMany({
            where: { sessionId: updated.sessionId }
        });

        const totalCost = sessionItems.reduce((sum, item) => {
            if (item.isPurchased && item.costPrice) {
                return sum + (Number(item.costPrice) * item.totalQty);
            }
            return sum;
        }, 0);

        await prisma.procurementSession.update({
            where: { id: updated.sessionId },
            data: { totalCost }
        });

        return NextResponse.json({ item: updated });
    } catch (error) {
        console.error('Error updating procurement item:', error);
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }
}
