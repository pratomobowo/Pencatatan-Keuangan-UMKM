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

// GET /api/shop/favorites - List customer favorites
export async function GET(request: NextRequest) {
    try {
        const tokenData = await getCustomerIdentity(request);

        if (!tokenData) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find customer record to get the correct customerId for favorites
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

        // Check if we just want to verify specific product status
        const checkId = new URL(request.url).searchParams.get('checkId');

        if (checkId) {
            const count = await (prisma as any).favorite.count({
                where: {
                    customerId: customer.id,
                    productId: checkId
                }
            });
            return NextResponse.json({ isFavorite: count > 0 });
        }

        const favorites = await (prisma as any).favorite.findMany({
            where: { customerId: customer.id },
            include: {
                product: {
                    include: {
                        variants: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Transform into product list
        const products = favorites.map((f: any) => f.product);

        return NextResponse.json(products);
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return NextResponse.json({ error: 'Gagal mengambil favorit' }, { status: 500 });
    }
}

// POST /api/shop/favorites - Add product to favorites
export async function POST(request: NextRequest) {
    try {
        const tokenData = await getCustomerIdentity(request);

        if (!tokenData) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find customer record to get the correct customerId for favorites
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

        const { productId } = await request.json();

        if (!productId) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
        }

        const favorite = await (prisma as any).favorite.upsert({
            where: {
                customerId_productId: {
                    customerId: customer.id,
                    productId
                }
            },
            update: {}, // Do nothing if exists
            create: {
                customerId: customer.id,
                productId
            }
        });

        return NextResponse.json(favorite);
    } catch (error) {
        console.error('Error adding favorite:', error);
        return NextResponse.json({ error: 'Gagal menambah favorit' }, { status: 500 });
    }
}

// DELETE /api/shop/favorites - Remove product from favorites
export async function DELETE(request: NextRequest) {
    try {
        const tokenData = await getCustomerIdentity(request);

        if (!tokenData) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find customer record to get the correct customerId for favorites
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

        const { productId } = await request.json();

        if (!productId) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
        }

        await (prisma as any).favorite.delete({
            where: {
                customerId_productId: {
                    customerId: customer.id,
                    productId
                }
            }
        });

        return NextResponse.json({ message: 'Removed from favorites' });
    } catch (error) {
        console.error('Error removing favorite:', error);
        return NextResponse.json({ error: 'Gagal menghapus favorit' }, { status: 500 });
    }
}
