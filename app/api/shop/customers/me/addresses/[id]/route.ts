import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { auth } from '@/lib/auth';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'shop-customer-secret-key-change-in-production'
);

// Helper to get customer identity from token or NextAuth session
async function getCustomerIdentity(request: NextRequest) {
    // 1. Try custom shop-token first (priority for direct shop login)
    const token = request.cookies.get('shop-token')?.value;

    if (token) {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            return payload as { userId: string; identifier: string; type: string };
        } catch {
            // Fall through to NextAuth check
        }
    }

    // 2. Try NextAuth session (for Google/Credentials login)
    const session = await auth();
    if (session?.user?.email) {
        return {
            userId: (session.user as any).id,
            identifier: session.user.email,
            type: 'next-auth'
        };
    }

    return null;
}

// PUT /api/shop/customers/me/addresses/[id] - Update address
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const tokenData = await getCustomerIdentity(request);

        if (!tokenData) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Find customer record to get the correct customerId for verification
        const customer = await prisma.customer.findFirst({
            where: {
                OR: [
                    { id: tokenData.userId },
                    { email: tokenData.identifier }
                ]
            } as any
        });

        if (!customer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            );
        }

        // Verify address belongs to customer
        const existing = await (prisma as any).address.findFirst({
            where: { id, customerId: customer.id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Address not found' },
                { status: 404 }
            );
        }

        const body = await request.json();
        const { label, name, phone, address, type, isDefault, latitude, longitude } = body;

        // If setting as default, unset others
        if (isDefault) {
            await (prisma as any).address.updateMany({
                where: { customerId: customer.id, id: { not: id } },
                data: { isDefault: false },
            });
        }

        const updated = await (prisma as any).address.update({
            where: { id },
            data: {
                label: label || undefined,
                name: name || undefined,
                phone: phone || undefined,
                address: address || undefined,
                latitude: latitude !== undefined ? latitude : undefined,
                longitude: longitude !== undefined ? longitude : undefined,
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
        const tokenData = await getCustomerIdentity(request);

        if (!tokenData) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Find customer record to get the correct customerId for verification
        const customer = await prisma.customer.findFirst({
            where: {
                OR: [
                    { id: tokenData.userId },
                    { email: tokenData.identifier }
                ]
            } as any
        });

        if (!customer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            );
        }

        // Verify address belongs to customer
        const existing = await (prisma as any).address.findFirst({
            where: { id, customerId: customer.id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Address not found' },
                { status: 404 }
            );
        }

        await (prisma as any).address.delete({
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
