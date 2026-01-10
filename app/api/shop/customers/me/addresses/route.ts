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

// GET /api/shop/customers/me/addresses - List customer addresses
export async function GET(request: NextRequest) {
    try {
        const tokenData = await getCustomerIdentity(request);

        if (!tokenData) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Find customer record to get the correct customerId for addresses
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

        const addresses = await (prisma as any).address.findMany({
            where: { customerId: customer.id },
            orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' },
            ],
        });

        return NextResponse.json(addresses);
    } catch (error: any) {
        console.error('Error fetching addresses:', error);
        return NextResponse.json(
            { error: 'Failed to fetch addresses' },
            { status: 500 }
        );
    }
}

// POST /api/shop/customers/me/addresses - Add new address
export async function POST(request: NextRequest) {
    try {
        const tokenData = await getCustomerIdentity(request);

        if (!tokenData) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Find customer record to get the correct customerId for addresses
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

        const body = await request.json();
        const { label, name, phone, address, type, isDefault, latitude, longitude } = body;

        // If this is default, unset other defaults
        if (isDefault) {
            await (prisma as any).address.updateMany({
                where: { customerId: customer.id },
                data: { isDefault: false },
            });
        }

        // Check if first address (make it default)
        const addressCount = await (prisma as any).address.count({
            where: { customerId: customer.id },
        });

        const newAddress = await (prisma as any).address.create({
            data: {
                customerId: customer.id,
                label,
                name,
                phone,
                address,
                latitude: latitude || null,
                longitude: longitude || null,
                type: type || 'home',
                isDefault: isDefault || addressCount === 0,
            },
        });

        return NextResponse.json(newAddress, { status: 201 });
    } catch (error: any) {
        console.error('Error creating address:', error);
        return NextResponse.json(
            { error: 'Failed to create address' },
            { status: 500 }
        );
    }
}
