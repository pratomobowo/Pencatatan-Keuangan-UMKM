import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { auth } from '@/lib/auth';
import { getJwtSecret } from '@/lib/jwt';

const JWT_SECRET = getJwtSecret();

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

export const dynamic = 'force-dynamic';

// GET /api/shop/customers/me - Get current customer profile
export async function GET(request: NextRequest) {
    try {
        const tokenData = await getCustomerIdentity(request);

        if (!tokenData) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Find customer by ID (if from shop-token) or email/phone (if from NextAuth or phone login)
        const customer = await prisma.customer.findFirst({
            where: {
                OR: [
                    { id: tokenData.userId },
                    { email: tokenData.identifier },
                    { phone: tokenData.identifier }
                ]
            } as any,
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                createdAt: true,
                _count: {
                    select: {
                        orders: true,
                    },
                },
            } as any,
        });

        // If not found and from NextAuth, auto-create it
        let finalCustomer = customer;
        if (!finalCustomer && tokenData.type === 'next-auth') {
            const session = await auth();
            finalCustomer = await prisma.customer.create({
                data: {
                    name: session?.user?.name || 'Customer',
                    email: tokenData.identifier,
                    // phone is now optional
                } as any,
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                    createdAt: true,
                    _count: {
                        select: {
                            orders: true,
                        },
                    },
                } as any
            });
        }

        if (!finalCustomer) {
            console.warn('Customer not found for token data:', tokenData);
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(finalCustomer);
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
        const tokenData = await getCustomerIdentity(request);

        if (!tokenData) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, email, phone } = body;

        // Find existing customer to get its current ID
        const existingCustomer = await prisma.customer.findFirst({
            where: {
                OR: [
                    { id: tokenData.userId },
                    { email: tokenData.identifier }
                ]
            } as any
        });

        if (!existingCustomer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            );
        }

        // Validate phone uniqueness if it's changing
        if (phone && phone !== existingCustomer.phone) {
            const phoneExists = await prisma.customer.findUnique({
                where: { phone }
            });

            if (phoneExists) {
                return NextResponse.json(
                    { error: 'Nomor HP sudah digunakan oleh akun lain.' },
                    { status: 400 }
                );
            }
        }

        const customer = await prisma.customer.update({
            where: { id: existingCustomer.id },
            data: {
                name: name || undefined,
                email: email || undefined,
                phone: phone || undefined,
            } as any,
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
            } as any,
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
