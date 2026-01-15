import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const data = await request.json();

        const unit = await prisma.unit.update({
            where: { id },
            data: {
                name: data.name,
                symbol: data.symbol,
                order: data.order,
                isActive: data.isActive,
            },
        });

        return NextResponse.json(unit);
    } catch (error: any) {
        console.error('Error updating unit:', error);
        return NextResponse.json({ error: 'Gagal mengupdate unit' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await prisma.unit.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Unit deleted' });
    } catch (error: any) {
        console.error('Error deleting unit:', error);
        return NextResponse.json({ error: 'Gagal menghapus unit' }, { status: 500 });
    }
}
