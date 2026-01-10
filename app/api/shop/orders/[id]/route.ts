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

// GET /api/shop/orders/[id] - Get order detail
export async function GET(
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

        // Find customer record to get the correct customerId for order verification
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

        const order = await prisma.order.findFirst({
            where: {
                id,
                customerId: customer.id,
            },
            include: {
                items: true,
            } as any,
        }) as any;

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
            items: order.items.map((item: any) => ({
                name: item.productName,
                quantity: item.qty,
                price: Number(item.price),
                originalPrice: item.originalPrice ? Number(item.originalPrice) : Number(item.price),
                image: item.productImage || '/images/coming-soon.jpg',
            })),
            subtotal: Number(order.subtotal),
            shippingFee: Number(order.shippingFee),
            serviceFee: Number(order.serviceFee),
            grandTotal: Number(order.grandTotal),
            recipientName: order.recipientName || order.customerName || 'Penerima',
            recipientPhone: order.recipientPhone || order.customerPhone || '-',
            shippingAddress: order.shippingAddress || order.customerAddress || '-',
            deliveryTime: order.deliveryTime,
            paymentMethod: order.paymentMethod,
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
