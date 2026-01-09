import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// PUT /api/admin/banners/[id] - Update banner
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, subtitle, badge, image, buttonText, link, order, isActive } = body;

        const banner = await (prisma as any).promoBanner.update({
            where: { id },
            data: {
                title,
                subtitle: subtitle !== undefined ? subtitle : undefined,
                badge: badge !== undefined ? badge : undefined,
                image,
                buttonText,
                link,
                order,
                isActive,
            },
        });

        return NextResponse.json(banner);
    } catch (error) {
        console.error('Error updating banner:', error);
        return NextResponse.json({ error: 'Gagal update banner' }, { status: 500 });
    }
}

// DELETE /api/admin/banners/[id] - Delete banner
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await (prisma as any).promoBanner.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting banner:', error);
        return NextResponse.json({ error: 'Gagal menghapus banner' }, { status: 500 });
    }
}
