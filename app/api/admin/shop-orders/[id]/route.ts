import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

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

        await prisma.order.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Order deleted' });
    } catch (error) {
        console.error('Error deleting shop order:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
