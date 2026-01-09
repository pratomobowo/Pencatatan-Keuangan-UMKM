import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/shop/products - Public endpoint for shop
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const limit = searchParams.get('limit');
        const promo = searchParams.get('promo'); // Filter for promo products

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

        // Filter promo products
        if (promo === 'true') {
            where.isPromo = true;
            // Check promo is still valid (not expired)
            where.OR = [
                { promoEndDate: null },
                { promoEndDate: { gte: new Date() } }
            ];
        }

        const products = await prisma.product.findMany({
            where,
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                price: true,
                stock: true,
                unit: true,
                image: true,
                category: true,
                isPromo: true,
                promoPrice: true,
                promoDiscount: true,
                promoStartDate: true,
                promoEndDate: true,
                variants: {
                    orderBy: { isDefault: 'desc' },
                    select: {
                        id: true,
                        productId: true,
                        unit: true,
                        unitQty: true,
                        price: true,
                        costPrice: true,
                        isDefault: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit ? parseInt(limit) : undefined,
        }) as any;

        // Transform prices from Decimal to number and calculate display price
        const transformedProducts = products.map((p: any) => {
            const now = new Date();
            const isPromoActive = p.isPromo &&
                (!p.promoStartDate || new Date(p.promoStartDate) <= now) &&
                (!p.promoEndDate || new Date(p.promoEndDate) >= now);

            return {
                ...p,
                price: Number(p.price),
                originalPrice: isPromoActive ? Number(p.price) : null,
                displayPrice: isPromoActive && p.promoPrice ? Number(p.promoPrice) : Number(p.price),
                promoPrice: p.promoPrice ? Number(p.promoPrice) : null,
                discount: isPromoActive ? p.promoDiscount : null,
                isPromoActive,
            };
        });

        return NextResponse.json(transformedProducts);
    } catch (error) {
        console.error('Error fetching shop products:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}
