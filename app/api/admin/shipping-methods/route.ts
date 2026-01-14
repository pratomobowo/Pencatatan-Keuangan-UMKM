import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/admin/shipping-methods - List all shipping methods (Admin only)
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const methods = await prisma.shippingMethod.findMany({
            orderBy: { order: 'asc' }
        });

        return NextResponse.json(methods);
    } catch (error) {
        console.error('Error fetching shipping methods:', error);
        return NextResponse.json(
            { error: 'Failed to fetch shipping methods' },
            { status: 500 }
        );
    }
}

// POST /api/admin/shipping-methods - Create new shipping method (Admin only)
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, type, baseFee, pricePerKm, minOrder, freeShippingMin, isActive, order } = body;

        if (!name || !type) {
            return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
        }

        const method = await prisma.shippingMethod.create({
            data: {
                name,
                description,
                type,
                baseFee: baseFee || 0,
                pricePerKm: pricePerKm || 0,
                minOrder: minOrder || 0,
                freeShippingMin: freeShippingMin || null,
                isActive: isActive !== undefined ? isActive : true,
                order: order || 0,
            }
        });

        return NextResponse.json(method, { status: 201 });
    } catch (error) {
        console.error('Error creating shipping method:', error);
        return NextResponse.json(
            { error: 'Failed to create shipping method' },
            { status: 500 }
        );
    }
}
