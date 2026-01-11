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
                isActive: true,
                // Add promo fields
                isPromo: true,
                promoPrice: true,
                promoDiscount: true,
                promoStartDate: true,
                promoEndDate: true,
                variants: {
                    orderBy: { isDefault: 'desc' }
                }
            },
        }) as any;

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

        const now = new Date();
        const isPromoActive = product.isPromo &&
            (!product.promoStartDate || new Date(product.promoStartDate) <= now) &&
            (!product.promoEndDate || new Date(product.promoEndDate) >= now);

        const promoPriceNum = (isPromoActive && product.promoPrice) ? Number(product.promoPrice) : null;

        // Transform price from Decimal to number
        const transformedProduct = {
            ...product,
            originalPrice: isPromoActive ? Number(product.price) : null,
            price: promoPriceNum || Number(product.price),
            promoPrice: product.promoPrice ? Number(product.promoPrice) : null,
            variants: product.variants ? product.variants.map((v: any) => ({
                ...v,
                price: (isPromoActive && v.isDefault && promoPriceNum) ? promoPriceNum : Number(v.price),
                costPrice: Number(v.costPrice),
                unitQty: Number(v.unitQty)
            })) : []
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
