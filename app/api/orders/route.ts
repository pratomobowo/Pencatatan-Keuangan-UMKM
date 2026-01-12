import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOrderNumber } from '@/lib/utils';
import { jwtVerify } from 'jose';
import { auth } from '@/lib/auth';
import { getJwtSecret } from '@/lib/jwt';
import { sendWhatsAppMessage, formatOrderMessage } from '@/lib/whatsapp';

const JWT_SECRET = getJwtSecret();

// Helper to get identity
async function getIdentity(request: NextRequest) {
    const token = request.cookies.get('shop-token')?.value;

    if (token) {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            return payload as { userId: string; identifier: string; type: string };
        } catch { /* Fall through */ }
    }

    const session = await auth();
    if (session?.user?.email) {
        return {
            userId: (session.user as any).id,
            identifier: session.user.email,
            type: 'next-auth',
            role: (session.user as any).role
        };
    }

    return null;
}

export const dynamic = 'force-dynamic';

// GET /api/orders - Get orders (Authenticated only)
export async function GET(request: NextRequest) {
    try {
        const identity = await getIdentity(request);
        if (!identity) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = identity.type === 'admin' || (identity as any).role === 'admin';
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const requestedCustomerId = searchParams.get('customerId');

        const where: any = {};
        if (status) where.status = status;

        // Authorization Logic
        if (!isAdmin) {
            // Find the actual customer record
            const customer = await prisma.customer.findFirst({
                where: {
                    OR: [
                        { id: identity.userId },
                        { email: identity.identifier }
                    ]
                } as any
            });

            if (!customer) {
                return NextResponse.json({ error: 'Customer record not found' }, { status: 404 });
            }

            // Force filter by the authenticated customer's ID
            where.customerId = customer.id;
        } else if (requestedCustomerId) {
            // Admins can filter by specific customer
            where.customerId = requestedCustomerId;
        }

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
        const identity = await getIdentity(request);
        if (!identity) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            customerId,
            customerName,
            customerAddress,
            customerPhone,
            items,
            subtotal,
            deliveryFee,
            shippingFee,
            shippingMethod,
            paymentMethod,
            discount,
            grandTotal,
            status,
            notes,
        } = body;

        const isAdmin = identity.type === 'admin' || (identity as any).role === 'admin';

        // Security check for non-admins: Ensure they are creating orders for themselves
        if (!isAdmin) {
            const customer = await prisma.customer.findFirst({
                where: {
                    OR: [
                        { id: identity.userId },
                        { email: identity.identifier }
                    ]
                } as any
            });

            if (!customer || customer.id !== customerId) {
                return NextResponse.json({ error: 'Forbidden: Cannot create order for another customer' }, { status: 403 });
            }
        }

        // Generate professional order number
        const orderNumber = generateOrderNumber();

        // Auto-create/link customer logic
        let linkedCustomerId = customerId;
        if (!linkedCustomerId && customerPhone) {
            // Search for existing regular customer by phone
            const existingCustomer = await prisma.customer.findFirst({
                where: { phone: customerPhone }
            });

            if (existingCustomer) {
                linkedCustomerId = existingCustomer.id;
            } else if (customerName) {
                // Create new customer record
                const newCustomer = await prisma.customer.create({
                    data: {
                        name: customerName,
                        phone: customerPhone,
                        address: customerAddress || '',
                    }
                });
                linkedCustomerId = newCustomer.id;
            }
        }

        // Create order with items in a transaction
        const order = await prisma.order.create({
            data: {
                orderNumber,
                customerId: linkedCustomerId,
                customerName,
                customerAddress,
                customerPhone,
                subtotal,
                shippingFee: shippingFee || deliveryFee || 0,
                shippingMethod: shippingMethod || 'DELIVERY',
                paymentMethod: paymentMethod || 'CASH',
                discount: discount || 0,
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
                        originalPrice: item.originalPrice || item.price,
                        costPrice: item.costPrice,
                        total: item.price * item.qty
                    }))
                }
            },
            include: {
                items: true
            }
        });

        // Send WhatsApp Notification to customer (Async)
        if (customerPhone) {
            (async () => {
                try {
                    // Fetch notification config from GowaConfig
                    const config = await prisma.gowaConfig.findUnique({
                        where: { id: 'global' }
                    });

                    if (config) {
                        const cfg = config as any;
                        if (cfg.notifyCustomer) {
                            const customerMsg = formatOrderMessage(order, cfg.customerTemplate || undefined);
                            await sendWhatsAppMessage(customerPhone, customerMsg);
                        }
                    }
                } catch (notifyError) {
                    console.error('Error sending WhatsApp notification (POS):', notifyError);
                }
            })();
        }

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
        const identity = await getIdentity(request);
        const isAdmin = identity?.type === 'admin' || (identity as any)?.role === 'admin';

        if (!isAdmin) {
            return NextResponse.json(
                { error: 'Unauthorized - Admin access required' },
                { status: 403 }
            );
        }

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
