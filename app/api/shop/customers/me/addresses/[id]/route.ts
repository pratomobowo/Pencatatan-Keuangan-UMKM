import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'shop-customer-secret-key-change-in-production'
);

// Helper to get customer from token
async function getCustomerFromToken(request: NextRequest) {
    const token = request.cookies.get('shop-token')?.value;

    if (!token) {
        return null;
    }

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as { customerId: string; phone: string };
    } catch {
        return null;
    }
}

// PUT /api/shop/customers/me/addresses/[id] - Update address
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const tokenData = await getCustomerFromToken(request);

        if (!tokenData) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify address belongs to customer
        const existing = await prisma.shopAddress.findFirst({
            where: { id, customerId: tokenData.customerId },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Address not found' },
                { status: 404 }
            );
        }

        const body = await request.json();
        const { label, name, phone, address, type, isDefault } = body;

        // If setting as default, unset others
        if (isDefault) {
            await prisma.shopAddress.updateMany({
                where: { customerId: tokenData.customerId, id: { not: id } },
                data: { isDefault: false },
            });
        }

        const updated = await prisma.shopAddress.update({
            where: { id },
            data: {
                label: label || undefined,
                name: name || undefined,
                phone: phone || undefined,
                address: address || undefined,
                type: type || undefined,
                isDefault: isDefault,
            },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('Error updating address:', error);
        return NextResponse.json(
            { error: 'Failed to update address' },
            { status: 500 }
        );
    }
}

// DELETE /api/shop/customers/me/addresses/[id] - Delete address
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const tokenData = await getCustomerFromToken(request);

        if (!tokenData) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify address belongs to customer
        const existing = await prisma.shopAddress.findFirst({
            where: { id, customerId: tokenData.customerId },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Address not found' },
                { status: 404 }
            );
        }

        await prisma.shopAddress.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Address deleted' });
    } catch (error: any) {
        console.error('Error deleting address:', error);
        return NextResponse.json(
            { error: 'Failed to delete address' },
            { status: 500 }
        );
    }
}
