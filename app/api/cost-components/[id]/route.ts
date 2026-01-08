import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/cost-components/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.costComponent.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Cost component deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting cost component:', error);

        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Cost component not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to delete cost component' },
            { status: 500 }
        );
    }
}
