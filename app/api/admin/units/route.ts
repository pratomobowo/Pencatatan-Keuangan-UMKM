import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
    try {
        const units = await prisma.unit.findMany({
            orderBy: { order: 'asc' },
        });

        return NextResponse.json(units);
    } catch (error: any) {
        console.error('Error fetching units:', error);
        return NextResponse.json({ error: 'Gagal mengambil unit' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();

        if (!data.name || !data.symbol) {
            return NextResponse.json({ error: 'Nama dan Simbol unit wajib diisi' }, { status: 400 });
        }

        const unit = await prisma.unit.create({
            data: {
                name: data.name,
                symbol: data.symbol,
                order: data.order || 0,
                isActive: data.isActive !== undefined ? data.isActive : true,
            },
        });

        return NextResponse.json(unit);
    } catch (error: any) {
        console.error('Error creating unit:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Nama atau Simbol unit sudah digunakan' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Gagal membuat unit' }, { status: 500 });
    }
}
