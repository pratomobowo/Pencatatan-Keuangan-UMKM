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

// GET /api/shop/customers/me/addresses - List customer addresses
export async function GET(request: NextRequest) {
    try {
        const tokenData = await getCustomerFromToken(request);

        if (!tokenData) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const addresses = await prisma.shopAddress.findMany({
            where: { customerId: tokenData.customerId },
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
        const tokenData = await getCustomerFromToken(request);

        if (!tokenData) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { label, name, phone, address, type, isDefault } = body;

        // If this is default, unset other defaults
        if (isDefault) {
            await prisma.shopAddress.updateMany({
                where: { customerId: tokenData.customerId },
                data: { isDefault: false },
            });
        }

        // Check if first address (make it default)
        const addressCount = await prisma.shopAddress.count({
            where: { customerId: tokenData.customerId },
        });

        const newAddress = await prisma.shopAddress.create({
            data: {
                customerId: tokenData.customerId,
                label,
                name,
                phone,
                address,
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
