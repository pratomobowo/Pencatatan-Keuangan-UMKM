import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOrderNumber } from '@/lib/utils';

// GET /api/orders - Get all orders
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const customerId = searchParams.get('customerId');

        const where: any = {};
        if (status) where.status = status;
        if (customerId) where.customerId = customerId;

        const orders = await prisma.order.findMany({
            where,
            include: {
                items: true,
                customer: {
                    select: {
                        name: true,
                        phone: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            customerId,
            customerName,
            customerAddress,
            customerPhone,
            items,
            subtotal,
            deliveryFee,
            grandTotal,
            status,
            notes,
        } = body;

        // Generate professional order number
        const orderNumber = generateOrderNumber();

        // Create order with items in a transaction
        const order = await prisma.order.create({
            data: {
                orderNumber,
                customerId,
                customerName,
                customerAddress,
                customerPhone,
                subtotal,
                shippingFee: deliveryFee || 0,
                grandTotal,
                status: status || 'PENDING',
                notes,
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        productName: item.productName,
                        qty: item.qty,
                        unit: item.unit,
                        price: item.price,
                        costPrice: item.costPrice,
                        total: item.price * item.qty
                    }))
                }
            },
            include: {
                items: true
            }
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        );
    }
}

// DELETE /api/orders - Bulk delete orders (admin only)
export async function DELETE(request: NextRequest) {
    try {
        const { ids } = await request.json();

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json(
                { error: 'Invalid IDs provided' },
                { status: 400 }
            );
        }

        await prisma.order.deleteMany({
            where: {
                id: {
                    in: ids
                }
            }
        });

        return NextResponse.json({ message: 'Orders deleted successfully' });
    } catch (error) {
        console.error('Error deleting orders:', error);
        return NextResponse.json(
            { error: 'Failed to delete orders' },
            { status: 500 }
        );
    }
}
