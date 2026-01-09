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

// GET /api/shop/orders/[id] - Get order detail
export async function GET(
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

        const order = await prisma.order.findFirst({
            where: {
                id,
                customerId: tokenData.userId,
            },
            include: {
                items: true,
            },
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Transform for frontend
        const transformed = {
            id: order.id,
            orderNumber: order.orderNumber,
            date: order.createdAt.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }),
            status: order.status.toLowerCase(),
            items: order.items.map(item => ({
                name: item.productName,
                quantity: item.qty,
                price: Number(item.price),
                image: item.productImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80',
            })),
            subtotal: Number(order.subtotal),
            shippingFee: Number(order.shippingFee),
            serviceFee: Number(order.serviceFee),
            total: Number(order.grandTotal),
            address: {
                name: order.recipientName || order.customerName || 'Penerima',
                phone: order.recipientPhone || order.customerPhone || '-',
                address: order.shippingAddress || order.customerAddress || '-',
            },
            deliveryTime: order.deliveryTime,
            paymentMethod: order.paymentMethod === 'cod'
                ? 'COD (Bayar di Tempat)'
                : 'Transfer Bank',
        };

        return NextResponse.json(transformed);
    } catch (error: any) {
        console.error('Error fetching order:', error);
        return NextResponse.json(
            { error: 'Failed to fetch order' },
            { status: 500 }
        );
    }
}
