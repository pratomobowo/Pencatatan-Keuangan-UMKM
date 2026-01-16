import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/shop/products - Public endpoint for shop
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const limitParam = searchParams.get('limit');
        const pageParam = searchParams.get('page');
        const promo = searchParams.get('promo'); // Filter for promo products

        const limit = limitParam ? parseInt(limitParam) : 10;
        const page = pageParam ? parseInt(pageParam) : 1;
        const skip = (page - 1) * limit;

        // Build where clause
        const conditions: any[] = [
            { isActive: true },
            {
                OR: [
                    { stock: { gt: 0 } },
                    { stockStatus: 'ALWAYS_READY' }
                ]
            }
        ];

        if (category) {
            conditions.push({
                OR: [
                    { categoryName: category },
                    { category: { slug: category } }
                ]
            });
        }

        if (search) {
            const searchLower = search.trim().toLowerCase();
            // Match products where:
            // 1. Name starts with the search term
            // 2. Name contains the search term as a separate word (space before it)
            conditions.push({
                OR: [
                    { name: { startsWith: searchLower, mode: 'insensitive' } },
                    { name: { contains: ` ${searchLower}`, mode: 'insensitive' } },
                    { categoryName: { contains: searchLower, mode: 'insensitive' } },
                ]
            });
        }

        const where: any = {
            AND: conditions
        };

        // Filter promo products
        if (promo === 'true') {
            const promoValidCondition = {
                OR: [
                    { promoEndDate: null },
                    { promoEndDate: { gte: new Date() } }
                ]
            };

            const promoFinalCondition = {
                isPromo: true,
                ...promoValidCondition
            };

            if (where.AND) {
                where.AND.push(promoFinalCondition);
            } else if (where.OR) {
                where.AND = [{ OR: where.OR }, promoFinalCondition];
                delete where.OR;
            } else {
                where.isPromo = true;
                where.OR = promoValidCondition.OR;
            }
        }

        // Get total count for pagination
        const total = await prisma.product.count({ where });

        // Determine order - if searching, prioritize by name match
        const orderBy = search
            ? [{ name: 'asc' as const }]
            : [{ createdAt: 'desc' as const }, { id: 'desc' as const }];

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
            orderBy,
            take: limit,
            skip: skip,
        }) as any;

        // Transform prices from Decimal to number and calculate display price
        const transformedProducts = products.map((p: any) => {
            const now = new Date();
            const isPromoActive = p.isPromo &&
                (!p.promoStartDate || new Date(p.promoStartDate) <= now) &&
                (!p.promoEndDate || new Date(p.promoEndDate) >= now);
            const promoPriceNum = (isPromoActive && p.promoPrice) ? Number(p.promoPrice) : null;

            // Find the lowest variant price
            let lowestVariantPrice = Number(p.price);
            if (p.variants && p.variants.length > 0) {
                lowestVariantPrice = Math.min(...p.variants.map((v: any) => Number(v.price)));
            }

            // Use promo price if active, otherwise lowest variant price
            const displayPrice = promoPriceNum || lowestVariantPrice;

            return {
                ...p,
                price: displayPrice,
                categoryName: p.categoryName,
                category: p.category,
                originalPrice: isPromoActive ? Number(p.price) : null,
                displayPrice,
                promoPrice: p.promoPrice ? Number(p.promoPrice) : null,
                discount: isPromoActive ? p.promoDiscount : null,
                isPromoActive,
                variants: p.variants ? p.variants.map((v: any) => ({
                    ...v,
                    price: (isPromoActive && v.isDefault && promoPriceNum) ? promoPriceNum : Number(v.price),
                    costPrice: Number(v.costPrice),
                    unitQty: Number(v.unitQty)
                })) : []
            };
        });

        return NextResponse.json({
            products: transformedProducts,
            total,
            page,
            limit,
            hasMore: skip + products.length < total
        });
    } catch (error: any) {
        console.error('Error fetching shop products:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products: ' + (error.message || 'Unknown error') },
            { status: 500 }
        );
    }
}
