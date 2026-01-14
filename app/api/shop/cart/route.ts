import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { auth } from '@/lib/auth';
import { getJwtSecret } from '@/lib/jwt';

const JWT_SECRET = getJwtSecret();

// Helper to get customer identity from token or NextAuth session
async function getCustomerIdentity(request: NextRequest) {
    const token = request.cookies.get('shop-token')?.value;

    if (token) {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            return payload as { userId: string; identifier: string; type: string };
        } catch {
            // Fall through
        }
    }

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

// GET /api/shop/cart - Fetch persistent cart
export async function GET(request: NextRequest) {
    try {
        const tokenData = await getCustomerIdentity(request);
        if (!tokenData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const customer = await prisma.customer.findFirst({
            where: {
                OR: [
                    { id: tokenData.userId },
                    { email: tokenData.identifier },
                    { phone: tokenData.identifier }
                ]
            } as any
        });

        if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

        const cart = await prisma.cart.findUnique({
            where: { customerId: customer.id },
            include: {
                items: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!cart) {
            return NextResponse.json({ items: [] });
        }

        // Map database models to frontend CartItem interface
        const formattedItems = cart.items.map(item => ({
            id: item.productId,
            name: '-', // Frontend will likely have static data, but we store what we can
            variant: item.variant,
            price: Number(item.price),
            originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
            quantity: item.qty,
            image: item.image || '',
            note: item.note || undefined
        }));

        // Note: Field mapping might need refinement based on Product model join if names change
        // For now, let's include basic product data
        const itemsWithDetails = await Promise.all(formattedItems.map(async (item) => {
            const product = await prisma.product.findUnique({
                where: { id: item.id },
                select: { name: true, image: true }
            });
            return {
                ...item,
                name: product?.name || item.name,
                image: product?.image || item.image
            };
        }));

        return NextResponse.json({ items: itemsWithDetails });
    } catch (error: any) {
        console.error('Error fetching cart:', error);
        return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
    }
}

// POST /api/shop/cart - Sync cart (Replace database items with provided list)
export async function POST(request: NextRequest) {
    try {
        const tokenData = await getCustomerIdentity(request);
        if (!tokenData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const customer = await prisma.customer.findFirst({
            where: {
                OR: [
                    { id: tokenData.userId },
                    { email: tokenData.identifier },
                    { phone: tokenData.identifier }
                ]
            } as any
        });

        if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

        const body = await request.json();
        const { items } = body;

        if (!Array.isArray(items)) {
            return NextResponse.json({ error: 'Invalid items format' }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            // 1. Get or Create Cart
            let cart = await tx.cart.findUnique({
                where: { customerId: customer.id }
            });

            if (!cart) {
                cart = await tx.cart.create({
                    data: { customerId: customer.id }
                });
            }

            // 2. Clear old items
            await tx.cartItem.deleteMany({
                where: { cartId: cart.id }
            });

            // 3. Add new items
            if (items.length > 0) {
                await tx.cartItem.createMany({
                    data: items.map((item: any) => ({
                        cartId: cart!.id,
                        productId: item.id,
                        qty: item.quantity,
                        variant: item.variant,
                        price: item.price,
                        originalPrice: item.originalPrice || null,
                        image: item.image || null,
                        note: item.note || null
                    }))
                });
            }
        });

        return NextResponse.json({ message: 'Cart synchronized' });
    } catch (error: any) {
        console.error('Error syncing cart:', error);
        return NextResponse.json({ error: 'Failed to sync cart' }, { status: 500 });
    }
}
