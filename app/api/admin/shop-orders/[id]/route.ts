import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { processLoyaltyPoints } from '@/lib/loyalty';

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

        const { status } = await request.json();

        // Fetch order with items first
        const order = await prisma.order.findUnique({
            where: { id },
            include: { items: true, customer: true },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const previousStatus = order.status;

        // === FINANCE INTEGRATION ===

        // 1. Handle CANCELLED - Return stock
        if (status === 'CANCELLED' && previousStatus !== 'CANCELLED') {
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

        // 2. Handle DELIVERED - Create income transaction + update customer stats/loyalty
        if (status === 'DELIVERED' && previousStatus !== 'DELIVERED') {
            // Create income transaction for the order
            await prisma.transaction.create({
                data: {
                    type: 'INCOME',
                    amount: order.subtotal,
                    category: 'Penjualan Ikan & Seafood',
                    description: `Order Online #${order.orderNumber} - ${order.customerName || 'Customer'}`,
                    orderId: order.id,
                },
            });

            // Create shipping income if applicable
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

            // Create service fee income if applicable
            if (Number(order.serviceFee) > 0) {
                await prisma.transaction.create({
                    data: {
                        type: 'INCOME',
                        amount: order.serviceFee,
                        category: 'Biaya Layanan',
                        description: `Service Fee Order #${order.orderNumber}`,
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

        // === END FINANCE INTEGRATION ===

        const updatedOrder = await prisma.order.update({
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

        // Trigger notification for customer if status changed
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
                await prisma.notification.create({
                    data: {
                        customerId: updatedOrder.customerId,
                        title: 'Update Status Pesanan',
                        message,
                        type: status === 'CANCELLED' ? 'error' : 'success'
                    }
                });
            }
        }

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error('Error updating shop order:', error);
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
