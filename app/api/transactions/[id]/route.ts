import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/transactions/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.transaction.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Transaction deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting transaction:', error);

        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Transaction not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to delete transaction' },
            { status: 500 }
        );
    }
}
