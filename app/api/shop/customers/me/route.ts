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
        return payload as { userId: string; identifier: string; type: string };
    } catch {
        return null;
    }
}

// GET /api/shop/customers/me - Get current customer profile
export async function GET(request: NextRequest) {
    try {
        const tokenData = await getCustomerFromToken(request);

        if (!tokenData) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const customer = await prisma.shopCustomer.findUnique({
            where: { id: tokenData.userId },
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                createdAt: true,
                _count: {
                    select: {
                        orders: true,
                        addresses: true,
                    },
                },
            },
        });

        if (!customer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(customer);
    } catch (error: any) {
        console.error('Error fetching customer:', error);
        return NextResponse.json(
            { error: 'Failed to fetch customer' },
            { status: 500 }
        );
    }
}

// PUT /api/shop/customers/me - Update customer profile
export async function PUT(request: NextRequest) {
    try {
        const tokenData = await getCustomerFromToken(request);

        if (!tokenData) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, email } = body;

        const customer = await prisma.shopCustomer.update({
            where: { id: tokenData.userId },
            data: {
                name: name || undefined,
                email: email || undefined,
            },
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
            },
        });

        return NextResponse.json(customer);
    } catch (error: any) {
        console.error('Error updating customer:', error);
        return NextResponse.json(
            { error: 'Failed to update customer' },
            { status: 500 }
        );
    }
}
