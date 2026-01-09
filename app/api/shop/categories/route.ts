import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
        });

        return NextResponse.json(categories);
    } catch (error: any) {
        console.error('Error fetching shop categories:', error);
        console.error('Stack:', error.stack);
        return NextResponse.json({ error: 'Gagal mengambil kategori: ' + error.message }, { status: 500 });
    }
}
