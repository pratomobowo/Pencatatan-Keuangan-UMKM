import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/shop/products - Public endpoint for shop
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const limit = searchParams.get('limit');
        const featured = searchParams.get('featured');

        // Build where clause
        const where: any = {
            isActive: true,
            stock: { gt: 0 } // Only in-stock products
        };

        if (category) {
            where.category = category;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const products = await prisma.product.findMany({
            where,
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                stock: true,
                unit: true,
                image: true,
                category: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit ? parseInt(limit) : undefined,
        });

        // Transform price from Decimal to number
        const transformedProducts = products.map(p => ({
            ...p,
            price: Number(p.price),
        }));

        return NextResponse.json(transformedProducts);
    } catch (error) {
        console.error('Error fetching shop products:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}
