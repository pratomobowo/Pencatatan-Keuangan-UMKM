import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/shop/shipping-methods - List active shipping methods for the shop
export async function GET() {
    try {
        const methods = await prisma.shippingMethod.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' }
        });

        return NextResponse.json(methods);
    } catch (error) {
        console.error('Error fetching shop shipping methods:', error);
        return NextResponse.json(
            { error: 'Failed to fetch shipping methods' },
            { status: 500 }
        );
    }
}
