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

// GET /api/shop/orders - List customer orders
export async function GET(request: NextRequest) {
    try {
        const tokenData = await getCustomerFromToken(request);

        if (!tokenData) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const where: any = { customerId: tokenData.customerId };
        if (status && status !== 'all') {
            where.status = status.toUpperCase();
        }

        const orders = await prisma.shopOrder.findMany({
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
        });

        // Transform for frontend
        const transformed = orders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            date: order.createdAt.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            }),
            status: order.status.toLowerCase(),
            items: order.items.map(item => ({
                name: item.productName,
                quantity: item.qty,
                image: item.productImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80',
            })),
            total: Number(order.total),
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
        const tokenData = await getCustomerFromToken(request);
        // Guest mode is allowed, so we don't return 401 if tokenData is null

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
        const shippingFee = 15000;
        const serviceFee = 1000;
        const total = subtotal + shippingFee + serviceFee;

        // Create order with items
        const order = await prisma.shopOrder.create({
            data: {
                customerId: tokenData?.customerId as any,
                addressLabel: addressLabel || null,
                addressName,
                addressPhone,
                addressFull,
                subtotal,
                shippingFee,
                serviceFee,
                total,
                paymentMethod: paymentMethod || 'cod',
                notes: notes || null,
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId || null,
                        productName: item.name,
                        productImage: item.image || null,
                        variant: item.variant || item.unit || '-',
                        qty: item.quantity,
                        price: item.price,
                        total: item.price * item.quantity,
                    })),
                },
            } as any,
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
