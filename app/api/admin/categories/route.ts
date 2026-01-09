import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const categories = await prisma.category.findMany({
            orderBy: { order: 'asc' },
        });

        return NextResponse.json(categories);
    } catch (error: any) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: 'Gagal mengambil kategori: ' + (error.message || 'Unknown error') }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();

        if (!data.name || !data.slug) {
            return NextResponse.json({ error: 'Nama dan Slug kategori wajib diisi' }, { status: 400 });
        }

        const category = await prisma.category.create({
            data: {
                name: data.name,
                slug: data.slug,
                image: data.image,
                color: data.color,
                order: data.order || 0,
                isActive: data.isActive !== undefined ? data.isActive : true,
            },
        });

        return NextResponse.json(category);
    } catch (error: any) {
        console.error('Error creating category:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Nama atau Slug kategori sudah digunakan' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Gagal membuat kategori: ' + (error.message || 'Unknown error') }, { status: 500 });
    }
}
