import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/admin/shipping-methods/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const method = await prisma.shippingMethod.findUnique({
            where: { id }
        });

        if (!method) {
            return NextResponse.json({ error: 'Shipping method not found' }, { status: 404 });
        }

        return NextResponse.json(method);
    } catch (error) {
        console.error('Error fetching shipping method:', error);
        return NextResponse.json(
            { error: 'Failed to fetch shipping method' },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/shipping-methods/[id] - Update shipping method (Admin only)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        // Whitelist allowed fields
        const allowedFields = [
            'name', 'description', 'type', 'isActive',
            'baseFee', 'pricePerKm', 'minOrder', 'freeShippingMin', 'order'
        ];

        const updateData: any = {};
        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        });

        const method = await prisma.shippingMethod.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(method);
    } catch (error) {
        console.error('Error updating shipping method:', error);
        return NextResponse.json(
            { error: 'Failed to update shipping method' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/shipping-methods/[id] - Delete shipping method (Admin only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await prisma.shippingMethod.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting shipping method:', error);
        return NextResponse.json(
            { error: 'Failed to delete shipping method' },
            { status: 500 }
        );
    }
}
