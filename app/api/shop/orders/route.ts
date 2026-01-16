import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { auth } from '@/lib/auth';
import { generateOrderNumber } from '@/lib/utils';
import { sendWhatsAppMessage, formatOrderMessage, formatAdminNotification } from '@/lib/whatsapp';
import { sanitizeString, validateOrderLimits } from '@/lib/sanitize';

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
            shippingMethod,
            shippingMethodId,
            notes,
            voucherCode
        } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Keranjang kosong' }, { status: 400 });
        }

        // Validate order limits
        const limitsCheck = validateOrderLimits(items, 0); // Will recalculate with validated prices
        if (!limitsCheck.valid) {
            return NextResponse.json({ error: limitsCheck.error }, { status: 400 });
        }

        // Sanitize text inputs
        const sanitizedNotes = sanitizeString(notes);
        const sanitizedAddressLabel = sanitizeString(addressLabel);

        const orderNumber = generateOrderNumber();

        // 1. Validate items and get actual prices from database
        const validatedItems: any[] = [];
        for (const item of items) {
            if (!item.productId) {
                return NextResponse.json({ error: `Product ID missing for ${item.name}` }, { status: 400 });
            }

            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                include: { variants: true }
            });

            if (!product) {
                return NextResponse.json({ error: `Produk tidak ditemukan: ${item.name}` }, { status: 400 });
            }

            // Stock validation (skip for ALWAYS_READY products)
            if (product.stockStatus !== 'ALWAYS_READY' && product.stock < item.quantity) {
                return NextResponse.json({
                    error: `Stok tidak cukup untuk ${product.name}. Tersedia: ${product.stock}`
                }, { status: 400 });
            }

            // Get correct price from variant or base product
            let actualPrice = Number(product.price);
            let actualCostPrice = Number(product.costPrice);

            if (item.variant && product.variants && product.variants.length > 0) {
                const selectedVariant = product.variants.find((v: any) => v.unit === item.variant);
                if (selectedVariant) {
                    actualPrice = Number(selectedVariant.price);
                    actualCostPrice = Number(selectedVariant.costPrice);
                }
            }

            validatedItems.push({
                ...item,
                price: actualPrice,
                costPrice: actualCostPrice,
                productName: product.name,
                productImage: product.image,
            });
        }

        // 2. Calculate base subtotal with validated prices
        const subtotal = validatedItems.reduce((sum: number, item: any) =>
            sum + (item.price * item.quantity), 0
        );

        // 3. Validate voucher if provided
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

        // 4. Perform everything in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // a. Deduct stock (already validated above)
            for (const item of validatedItems) {
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

            // c. Clear database cart
            if (customerId) {
                await tx.cart.delete({
                    where: { customerId: customerId }
                }).catch(() => {
                    // Ignore if cart doesn't exist
                });
            }

            // d. Create order
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
                    shippingMethod: shippingMethod || 'DELIVERY',
                    shippingMethodId: shippingMethodId || null,
                    notes: sanitizedNotes ? `${sanitizedAddressLabel ? `[${sanitizedAddressLabel}] ` : ''}${sanitizedNotes}` : (sanitizedAddressLabel ? `[${sanitizedAddressLabel}]` : null),
                    items: {
                        create: validatedItems.map((item: any) => ({
                            productId: item.productId || null,
                            productName: item.productName || item.name,
                            productImage: item.productImage || item.image || null,
                            variant: item.variant || '-',
                            qty: item.quantity,
                            unit: item.variant || 'pcs',
                            price: item.price,
                            originalPrice: item.originalPrice || item.price,
                            costPrice: item.costPrice, // Now properly snapshotted from database
                            total: item.price * item.quantity,
                            note: item.note || null,
                        })),
                    },
                } as any,
                include: { items: true, method: true }
            });
        });

        // 4. Send WhatsApp Notifications (Async)
        (async () => {
            try {
                // Fetch notification config from GowaConfig
                const config = await prisma.gowaConfig.findUnique({
                    where: { id: 'global' }
                });

                if (config) {
                    const cfg = config as any;
                    // a. Notify Admins (Broadcast)
                    if (cfg.notifyAdmin && cfg.adminPhones && cfg.adminPhones.length > 0) {
                        const adminMsg = formatAdminNotification(result, cfg.adminTemplate || undefined);
                        // Send to all admin numbers
                        await Promise.all(cfg.adminPhones.map((phone: string) =>
                            sendWhatsAppMessage(phone, adminMsg)
                        ));
                    }

                    // b. Notify Customer
                    if (cfg.notifyCustomer && addressPhone) {
                        const customerMsg = formatOrderMessage(result, cfg.customerTemplate || undefined);
                        await sendWhatsAppMessage(addressPhone, customerMsg);
                    }
                }
            } catch (notifyError) {
                console.error('Error sending WhatsApp notifications:', notifyError);
            }
        })();

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
