import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/utils';

// GET /api/products - Get all products with variants
export async function GET() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                variants: {
                    orderBy: { isDefault: 'desc' }
                }
            }
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

// POST /api/products - Create new product with optional variants
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            sku, name, description, price, costPrice, stock, unit, image, category, isActive,
            isPromo, promoPrice, promoDiscount, promoStartDate, promoEndDate,
            variants // Optional array of variants
        } = body;

        // Auto-generate SKU if not provided
        const productSku = sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Generate slug
        let baseSlug = slugify(name);
        let finalSlug = baseSlug;
        let counter = 1;

        // Ensure slug uniqueness
        while (true) {
            const existing = await prisma.product.findUnique({
                where: { slug: finalSlug }
            });
            if (!existing) break;
            finalSlug = `${baseSlug}-${counter}`;
            counter++;
        }

        const product = await prisma.product.create({
            data: {
                sku: productSku,
                name,
                slug: finalSlug,
                description: description || null,
                price,
                costPrice,
                stock: stock || 0,
                unit,
                image: image || null,
                category: category || null,
                isActive: isActive !== undefined ? isActive : true,
                isPromo: isPromo || false,
                promoPrice: promoPrice || null,
                promoDiscount: promoDiscount || null,
                promoStartDate: promoStartDate ? new Date(promoStartDate) : null,
                promoEndDate: promoEndDate ? new Date(promoEndDate) : null,
                // Create variants if provided
                variants: variants && variants.length > 0 ? {
                    create: variants.map((v: any, index: number) => ({
                        unit: v.unit,
                        unitQty: v.unitQty || 1,
                        price: v.price,
                        costPrice: v.costPrice || v.price * 0.7,
                        isDefault: index === 0 // First variant is default
                    }))
                } : undefined
            },
            include: {
                variants: true
            }
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
