import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/orders - Get all orders
export async function GET() {
    try {
        const orders = await prisma.order.findMany({
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                customer: true,
            },
            orderBy: { createdAt: 'desc' },
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

        // Create order with items in a transaction
        const order = await prisma.order.create({
            data: {
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
                        total: item.total,
                    })),
                },
            },
            include: {
                items: true,
            },
        });

        // Update product stock
        for (const item of items) {
            if (item.productId) {
                await prisma.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            decrement: item.qty,
                        },
                    },
                });
            }
        }

        return NextResponse.json(order, { status: 201 });
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        );
    }
}
