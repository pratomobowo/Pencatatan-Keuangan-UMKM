import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { auth } from '@/lib/auth';
import { generateOrderNumber } from '@/lib/utils';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'shop-customer-secret-key-change-in-production'
);

// Helper to get customer identity from token or NextAuth session
async function getCustomerIdentity(request: NextRequest) {
    const token = request.cookies.get('shop-token')?.value;

    if (token) {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            return payload as { userId: string; identifier: string; type: string };
        } catch {
            // Fall through
        }
    }

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

export async function POST(request: NextRequest) {
    try {
        const tokenData = await getCustomerIdentity(request);
        let customerId = null;
        if (tokenData) {
            const customer = await prisma.customer.findFirst({
                where: {
                    OR: [
                        { id: tokenData.userId },
                        { email: tokenData.identifier }
                    ]
                } as any
            });
            customerId = customer?.id || null;
        }

        const body = await request.json();
        const {
            items,
            addressLabel,
            addressName,
            addressPhone,
            addressFull,
            paymentMethod,
            notes,
            voucherCode
        } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Keranjang kosong' }, { status: 400 });
        }

        const orderNumber = generateOrderNumber();

        // 1. Calculate base subtotal
        const subtotal = items.reduce((sum: number, item: any) =>
            sum + (item.price * item.quantity), 0
        );

        // 2. Validate voucher if provided
        let discount = 0;
        let voucherToUpdate = null;

        if (voucherCode && customerId) {
            const voucher = await (prisma as any).voucher.findUnique({
                where: { code: voucherCode },
                include: { product: true }
            });

            if (voucher && !voucher.isUsed && voucher.customerId === customerId) {
                if (voucher.type === 'DISCOUNT' || voucher.type === 'SHIPPING') {
                    discount = Number(voucher.value);
                } else if (voucher.type === 'PRODUCT' && voucher.productId) {
                    // For product gift voucher, we'll implement it as matching the product value 
                    // or just a 100% discount on that specific item in the cart.
                    // For simplicity, let's say the gift product should be in the cart or we add it?
                    // Actually, the user story says "Voucher Digital".
                    // Let's assume it's a fixed discount value for now based on reward config.
                    discount = Number(voucher.value) || 0;
                }
                voucherToUpdate = voucher.id;
            }
        }

        const shippingFee = Number(body.shippingFee) || 0;
        const serviceFee = Number(body.serviceFee) || 0;

        // Final total: Subtotal + Ongkir + Service - Discount
        // Ensure grand total is not negative
        const grandTotal = Math.max(0, subtotal + shippingFee + serviceFee - discount);

        // 3. Perform everything in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // a. Deduct stock
            for (const item of items) {
                if (item.productId) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { decrement: item.quantity } },
                    });
                }
            }

            // b. Mark voucher as used
            if (voucherToUpdate) {
                await (tx as any).voucher.update({
                    where: { id: voucherToUpdate },
                    data: { isUsed: true }
                });
            }

            // c. Create order
            return await tx.order.create({
                data: {
                    orderNumber: orderNumber,
                    customerId: customerId,
                    recipientName: addressName,
                    recipientPhone: addressPhone,
                    shippingAddress: addressFull,
                    customerName: addressName,
                    customerPhone: addressPhone,
                    customerAddress: addressFull,
                    subtotal,
                    shippingFee,
                    serviceFee,
                    discount,
                    grandTotal,
                    source: 'ONLINE',
                    paymentMethod: paymentMethod || 'cod',
                    notes: notes ? `${addressLabel ? `[${addressLabel}] ` : ''}${notes}` : (addressLabel ? `[${addressLabel}]` : null),
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.productId || null,
                            productName: item.name,
                            productImage: item.image || null,
                            variant: item.variant || item.unit || '-',
                            qty: item.quantity,
                            unit: item.unit || 'pcs',
                            price: item.price,
                            originalPrice: item.originalPrice || item.price,
                            costPrice: item.costPrice || 0,
                            total: item.price * item.quantity,
                            note: item.note || null,
                        })),
                    },
                } as any,
            });
        });

        return NextResponse.json({
            message: 'Order berhasil dibuat',
            order: {
                id: result.id,
                orderNumber: result.orderNumber,
            },
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating order:', error);
        return NextResponse.json({ error: 'Gagal membuat order' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const tokenData = await getCustomerIdentity(request);
        if (!tokenData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const customer = await prisma.customer.findFirst({
            where: {
                OR: [
                    { id: tokenData.userId },
                    { email: tokenData.identifier }
                ]
            } as any
        });

        if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const where: any = { customerId: customer.id };
        if (status === 'processing') {
            where.status = { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPING'] };
        } else if (status === 'delivered') {
            where.status = 'DELIVERED';
        } else if (status && status !== 'all') {
            where.status = status.toUpperCase();
        }

        const orders = await prisma.order.findMany({
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
        } as any);

        const transformed = orders.map((order: any) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            date: order.createdAt.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            }),
            status: order.status.toLowerCase(),
            items: order.items.map((item: any) => ({
                name: item.productName,
                quantity: item.qty,
                image: item.productImage || '/images/coming-soon.jpg',
            })),
            total: Number(order.grandTotal),
        }));

        return NextResponse.json(transformed);
    } catch (error: any) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
