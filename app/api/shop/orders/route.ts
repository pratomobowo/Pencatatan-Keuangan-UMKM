import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { auth } from '@/lib/auth';
import { generateOrderNumber } from '@/lib/utils';

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

// GET /api/shop/orders - List customer orders
export async function GET(request: NextRequest) {
    try {
        const tokenData = await getCustomerIdentity(request);

        if (!tokenData) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Find customer record to get the correct customerId for orders
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

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const where: any = { customerId: customer.id };
        if (status === 'processing') {
            where.status = {
                in: ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPING']
            };
        } else if (status === 'delivered') {
            where.status = 'DELIVERED';
        } else if (status && status !== 'all') {
            where.status = status.toUpperCase();
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                items: {
                    select: {
                        productName: true,
                        productImage: true,
                        qty: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        } as any);

        // Transform for frontend
        const transformed = orders.map((order: any) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            date: order.createdAt.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            }),
            status: order.status.toLowerCase(),
            items: order.items.map((item: any) => ({
                name: item.productName,
                quantity: item.qty,
                image: item.productImage || '/images/coming-soon.jpg',
            })),
            total: Number(order.grandTotal),
        }));

        return NextResponse.json(transformed);
    } catch (error: any) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}

// POST /api/shop/orders - Create new order (checkout)
export async function POST(request: NextRequest) {
    try {
        const tokenData = await getCustomerIdentity(request);
        // Guest mode is allowed, so we don't return 401 if tokenData is null

        // Find customer record if identity exists
        let customerId = null;
        if (tokenData) {
            const customer = await prisma.customer.findFirst({
                where: {
                    OR: [
                        { id: tokenData.userId },
                        { email: tokenData.identifier }
                    ]
                } as any
            });
            customerId = customer?.id || null;
        }

        const body = await request.json();
        const {
            items,
            addressLabel,
            addressName,
            addressPhone,
            addressFull,
            paymentMethod,
            notes,
        } = body;

        const orderNumber = generateOrderNumber();

        // Validate items
        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: 'Keranjang kosong' },
                { status: 400 }
            );
        }

        // Calculate totals
        const subtotal = items.reduce((sum: number, item: any) =>
            sum + (item.price * item.quantity), 0
        );

        // Get fees from body (passed from dynamic calculation in frontend)
        const shippingFee = Number(body.shippingFee) || 0;
        const serviceFee = Number(body.serviceFee) || 0;
        const grandTotal = subtotal + shippingFee + serviceFee;

        // Create order with items
        const order = await prisma.order.create({
            data: {
                orderNumber: orderNumber,
                customerId: customerId,
                // Map Address fields to new Order model
                recipientName: addressName,
                recipientPhone: addressPhone,
                shippingAddress: addressFull,
                customerName: addressName, // Snapshot
                customerPhone: addressPhone, // Snapshot
                customerAddress: addressFull, // Snapshot

                // Financials
                subtotal,
                shippingFee,
                serviceFee,
                grandTotal,

                // Meta
                source: 'ONLINE',
                paymentMethod: paymentMethod || 'cod',
                notes: notes ? `${addressLabel ? `[${addressLabel}] ` : ''}${notes}` : (addressLabel ? `[${addressLabel}]` : null),

                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId || null,
                        productName: item.name,
                        productImage: item.image || null,
                        variant: item.variant || item.unit || '-',
                        qty: item.quantity,
                        unit: item.unit || 'pcs',
                        price: item.price,
                        originalPrice: item.originalPrice || item.price,
                        costPrice: item.costPrice || 0, // Fallback
                        total: item.price * item.quantity,
                        note: item.note || null,
                    })),
                },
            } as any, // Cast to any to bypass TS error until schema push
            include: {
                items: true,
            },
        });

        return NextResponse.json({
            message: 'Order berhasil dibuat',
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
            },
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating order:', error);
        return NextResponse.json(
            { error: 'Gagal membuat order' },
            { status: 500 }
        );
    }
}
