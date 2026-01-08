import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/products - Get all products
export async function GET() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sku, name, description, price, costPrice, stock, unit, image, category, isActive } = body;

        // Auto-generate SKU if not provided
        const productSku = sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        const product = await prisma.product.create({
            data: {
                sku: productSku,
                name,
                description: description || null,
                price,
                costPrice,
                stock: stock || 0,
                unit,
                image: image || null,
                category: category || null,
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        return NextResponse.json(product, { status: 201 });
    } catch (error: any) {
        console.error('Error creating product:', error);

        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Product with this SKU already exists' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create product' },
            { status: 500 }
        );
    }
}
