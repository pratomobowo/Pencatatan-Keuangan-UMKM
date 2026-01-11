import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/admin/banners - List all banners
export async function GET() {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const banners = await (prisma as any).promoBanner.findMany({
            orderBy: { order: 'asc' },
        });

        return NextResponse.json(banners);
    } catch (error: any) {
        console.error('Error fetching banners:', error);
        return NextResponse.json({ error: 'Gagal mengambil banner: ' + (error.message || 'Unknown error') }, { status: 500 });
    }
}

// POST /api/admin/banners - Create new banner
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, subtitle, badge, image, buttonText, link, order, isActive } = body;

        if (!title || !image) {
            return NextResponse.json({ error: 'Judul dan Gambar harus diisi' }, { status: 400 });
        }

        const banner = await (prisma as any).promoBanner.create({
            data: {
                title,
                subtitle: subtitle || null,
                badge: badge || null,
                image,
                buttonText: buttonText || 'Belanja Sekarang',
                link: link || '/products',
                order: order || 0,
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        return NextResponse.json(banner, { status: 201 });
    } catch (error) {
        console.error('Error creating banner:', error);
        return NextResponse.json({ error: 'Gagal membuat banner' }, { status: 500 });
    }
}
