import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processLoyaltyPoints } from '@/lib/loyalty';

// GET /api/orders/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                customer: true,
            },
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json(
            { error: 'Failed to fetch order' },
            { status: 500 }
        );
    }
}

// PATCH /api/orders/[id] - Update order status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        const order = await prisma.order.findUnique({
            where: { id },
            include: { items: true, customer: true },
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Handle status changes
        if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
            // Return stock
            for (const item of order.items) {
                if (item.productId) {
                    await prisma.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: {
                                increment: item.qty,
                            },
                        },
                    });
                }
            }
        }

        if (status === 'PAID' && order.status !== 'PAID') {
            // Create income transactions
            await prisma.transaction.create({
                data: {
                    type: 'INCOME',
                    amount: order.subtotal,
                    category: 'Penjualan Ikan & Seafood',
                    description: `Order #${order.orderNumber} - ${order.customerName}`,
                    orderId: order.id,
                },
            });

            if (Number(order.shippingFee) > 0) {
                await prisma.transaction.create({
                    data: {
                        type: 'INCOME',
                        amount: order.shippingFee,
                        category: 'Ongkos Kirim (Delivery)',
                        description: `Ongkir Order #${order.orderNumber}`,
                        orderId: order.id,
                    },
                });
            }

            // Loyalty Points & Customer Stats Integration
            if (order.customerId) {
                await processLoyaltyPoints(
                    order.customerId,
                    Number(order.grandTotal),
                    order.id,
                    order.orderNumber
                );
            }
        }

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { status },
            include: {
                items: true,
                customer: true,
            },
        });

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json(
            { error: 'Failed to update order' },
            { status: 500 }
        );
    }
}

// DELETE /api/orders/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const order = await prisma.order.findUnique({
            where: { id },
            include: { items: true },
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Return stock if not cancelled
        if (order.status !== 'CANCELLED') {
            for (const item of order.items) {
                if (item.productId) {
                    await prisma.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: {
                                increment: item.qty,
                            },
                        },
                    });
                }
            }
        }

        await prisma.order.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        return NextResponse.json(
            { error: 'Failed to delete order' },
            { status: 500 }
        );
    }
}
