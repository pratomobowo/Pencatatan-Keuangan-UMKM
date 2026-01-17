import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { getJwtSecret } from '@/lib/jwt';

const JWT_SECRET = getJwtSecret();

// GET /api/shop/orders/lookup?phone=08xxx
// Returns recent orders for chat display (simplified format)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone');

        // Also try to get customer from token
        let customerId: string | null = null;
        const token = request.cookies.get('shop-token')?.value;

        if (token) {
            try {
                const { payload } = await jwtVerify(token, JWT_SECRET);
                customerId = payload.sub as string;
            } catch {
                // Token invalid, continue without customerId
            }
        }

        // Build where clause
        const whereClause: any = {};

        if (customerId) {
            whereClause.customerId = customerId;
        } else if (phone) {
            // Clean phone number
            const cleanPhone = phone.replace(/\D/g, '');
            whereClause.customerPhone = {
                contains: cleanPhone.slice(-8) // Match last 8 digits
            };
        } else {
            return NextResponse.json({
                error: 'Phone number or authentication required'
            }, { status: 400 });
        }

        // Get recent orders (last 5)
        const orders = await prisma.order.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                orderNumber: true,
                status: true,
                grandTotal: true,
                createdAt: true,
                items: {
                    select: {
                        productName: true,
                        qty: true,
                        unit: true,
                    },
                    take: 3 // Only first 3 items for preview
                },
                _count: {
                    select: { items: true }
                }
            }
        });

        // Transform for chat display
        const chatOrders = orders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            statusLabel: getStatusLabel(order.status),
            statusColor: getStatusColor(order.status),
            total: Number(order.grandTotal),
            date: order.createdAt,
            itemPreview: order.items.map(i => `${i.qty} ${i.unit} ${i.productName}`).join(', '),
            totalItems: order._count.items,
            moreItems: order._count.items > 3 ? order._count.items - 3 : 0
        }));

        return NextResponse.json({ orders: chatOrders });
    } catch (error) {
        console.error('Error looking up orders:', error);
        return NextResponse.json(
            { error: 'Failed to lookup orders' },
            { status: 500 }
        );
    }
}

function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        'PENDING': 'Menunggu Konfirmasi',
        'CONFIRMED': 'Dikonfirmasi',
        'PREPARING': 'Sedang Diproses',
        'SHIPPING': 'Dalam Pengiriman',
        'DELIVERED': 'Selesai',
        'CANCELLED': 'Dibatalkan',
    };
    return labels[status] || status;
}

function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        'PENDING': 'yellow',
        'CONFIRMED': 'blue',
        'PREPARING': 'orange',
        'SHIPPING': 'purple',
        'DELIVERED': 'green',
        'CANCELLED': 'red',
    };
    return colors[status] || 'gray';
}
