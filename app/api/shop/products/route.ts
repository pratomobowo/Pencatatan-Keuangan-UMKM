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
            where.OR = [
                { categoryName: category },
                { category: { slug: category } }
            ];
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
            const promoValidCondition = {
                OR: [
                    { promoEndDate: null },
                    { promoEndDate: { gte: new Date() } }
                ]
            };

            if (where.OR) {
                // If we already have an OR (from category filter), we need to AND it with promo condition
                // Prisma handles this naturally if we use AND
                where.AND = [
                    { OR: where.OR },
                    promoValidCondition
                ];
                delete where.OR;
            } else {
                where.OR = promoValidCondition.OR;
            }
        }

        const products = await prisma.product.findMany({
            where,
            include: {
                category: true,
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
                categoryName: p.categoryName, // Explicitly map if needed, though it's already in p
                category: p.category,
                originalPrice: isPromoActive ? Number(p.price) : null,
                displayPrice: isPromoActive && p.promoPrice ? Number(p.promoPrice) : Number(p.price),
                promoPrice: p.promoPrice ? Number(p.promoPrice) : null,
                discount: isPromoActive ? p.promoDiscount : null,
                isPromoActive,
            };
        });

        return NextResponse.json(transformedProducts);
    } catch (error: any) {
        console.error('Error fetching shop products:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json(
            { error: 'Failed to fetch products: ' + (error.message || 'Unknown error') },
            { status: 500 }
        );
    }
}
