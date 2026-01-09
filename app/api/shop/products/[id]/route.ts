import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/shop/products/[id] - Public endpoint for product detail
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const product = await prisma.product.findUnique({
            where: { id },
            select: {
                id: true,
                sku: true,
                name: true,
                description: true,
                price: true,
                stock: true,
                unit: true,
                image: true,
                categoryName: true,
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        image: true,
                        color: true
                    }
                },
            },
        });

        if (!product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        if (!product.isActive) {
            return NextResponse.json(
                { error: 'Product is not available' },
                { status: 404 }
            );
        }

        // Transform price from Decimal to number
        const transformedProduct = {
            ...product,
            price: Number(product.price),
        };

        return NextResponse.json(transformedProduct);
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json(
            { error: 'Failed to fetch product' },
            { status: 500 }
        );
    }
}
