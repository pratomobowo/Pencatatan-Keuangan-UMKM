import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/shop/banners - List all active banners for shop
export async function GET() {
    try {
        let banners = await (prisma as any).promoBanner.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
        });

        // Auto-seed if empty
        if (banners.length === 0) {
            const initialBanners = [
                {
                    title: 'Ikan Laut Segar',
                    subtitle: 'Langsung dari nelayan lokal',
                    badge: 'PROMO SPESIAL',
                    image: '/images/coming-soon.jpg',
                    buttonText: 'Belanja Sekarang',
                    link: '/products',
                    order: 1,
                    isActive: true
                },
                {
                    title: 'Daging Sapi Pilihan',
                    subtitle: 'Potongan premium untuk keluarga',
                    badge: 'FLASH SALE',
                    image: '/images/coming-soon.jpg',
                    buttonText: 'Lihat Promo',
                    link: '/products',
                    order: 2,
                    isActive: true
                }
            ];

            for (const bannerData of initialBanners) {
                await (prisma as any).promoBanner.create({ data: bannerData });
            }

            banners = await (prisma as any).promoBanner.findMany({
                where: { isActive: true },
                orderBy: { order: 'asc' },
            });
        }

        return NextResponse.json(banners);
    } catch (error) {
        console.error('Error fetching shop banners:', error);
        return NextResponse.json({ error: 'Gagal memuat promo' }, { status: 500 });
    }
}
