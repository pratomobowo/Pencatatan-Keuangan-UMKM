import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { processLoyaltyPoints } from '@/lib/loyalty';
import { INCOME_CATEGORIES } from '@/lib/finance';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { status, expectedStatus } = await request.json();

        // Use transaction with optimistic locking to prevent race conditions
        const result = await prisma.$transaction(async (tx) => {
            // Fetch order with lock
            const order = await tx.order.findUnique({
                where: { id },
                include: { items: true, customer: true },
            });

            if (!order) {
                throw new Error('ORDER_NOT_FOUND');
            }

            const previousStatus = order.status;

            // Optimistic locking: If expectedStatus is provided, verify it matches
            if (expectedStatus && previousStatus !== expectedStatus) {
                throw new Error('STATUS_CHANGED');
            }

            // 1. Handle CANCELLED - Return stock (inside transaction)
            if (status === 'CANCELLED' && previousStatus !== 'CANCELLED') {
                for (const item of order.items) {
                    if (item.productId) {
                        await tx.product.update({
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

            // 2. Handle DELIVERED - Create income transaction + update customer stats/loyalty
            if (status === 'DELIVERED' && previousStatus !== 'DELIVERED') {
                // Create income transaction for the order
                await tx.transaction.create({
                    data: {
                        type: 'INCOME',
                        amount: order.subtotal,
                        category: INCOME_CATEGORIES.PRODUCT_SALES,
                        description: `Order Online #${order.orderNumber} - ${order.customerName || 'Customer'}`,
                        orderId: order.id,
                    },
                });

                // Create shipping income if applicable
                if (Number(order.shippingFee) > 0) {
                    await tx.transaction.create({
                        data: {
                            type: 'INCOME',
                            amount: order.shippingFee,
                            category: 'Ongkos Kirim (Delivery)',
                            description: `Ongkir Order #${order.orderNumber}`,
                            orderId: order.id,
                        },
                    });
                }

                // Create service fee income if applicable
                if (Number(order.serviceFee) > 0) {
                    await tx.transaction.create({
                        data: {
                            type: 'INCOME',
                            amount: order.serviceFee,
                            category: 'Biaya Layanan',
                            description: `Service Fee Order #${order.orderNumber}`,
                            orderId: order.id,
                        },
                    });
                }
            }

            // Update order status
            const updatedOrder = await tx.order.update({
                where: { id },
                data: { status },
                include: {
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                        }
                    },
                    items: true
                }
            });

            // Create notification for customer
            if (updatedOrder.customerId) {
                let message = '';
                switch (status) {
                    case 'CONFIRMED': message = 'Pesanan Anda telah dikonfirmasi oleh admin.'; break;
                    case 'PREPARING': message = 'Pesanan Anda sedang disiapkan.'; break;
                    case 'SHIPPING': message = 'Pesanan Anda sedang dalam perjalanan.'; break;
                    case 'DELIVERED': message = 'Pesanan Anda telah sampai di tujuan. Terima kasih!'; break;
                    case 'CANCELLED': message = 'Maaf, pesanan Anda telah dibatalkan.'; break;
                }

                if (message) {
                    await tx.notification.create({
                        data: {
                            customerId: updatedOrder.customerId,
                            title: 'Update Status Pesanan',
                            message,
                            type: status === 'CANCELLED' ? 'error' : 'success'
                        }
                    });
                }
            }

            return updatedOrder;
        });

        // Process loyalty points outside transaction (side effect)
        if (status === 'DELIVERED' && result.customerId) {
            await processLoyaltyPoints(
                result.customerId,
                Number(result.grandTotal),
                result.id,
                result.orderNumber
            );
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error updating shop order:', error);

        if (error.message === 'ORDER_NOT_FOUND') {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }
        if (error.message === 'STATUS_CHANGED') {
            return NextResponse.json({ error: 'Status order sudah berubah, refresh halaman' }, { status: 409 });
        }

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: { items: true },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Return stock if order is not cancelled
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
            where: { id }
        });

        return NextResponse.json({ message: 'Order deleted' });
    } catch (error) {
        console.error('Error deleting shop order:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
