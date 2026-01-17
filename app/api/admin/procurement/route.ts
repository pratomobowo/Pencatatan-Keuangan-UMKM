import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET - Fetch procurement session by date (default: today)
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || !['admin', 'user'].includes((session.user as any)?.role || '')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date');

        // Parse date or use today
        const targetDate = dateParam ? new Date(dateParam) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const procurementSession = await prisma.procurementSession.findUnique({
            where: { date: targetDate },
            include: {
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, costPrice: true, unit: true }
                        }
                    },
                    orderBy: { productName: 'asc' }
                },
                expenses: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!procurementSession) {
            return NextResponse.json({ session: null, message: 'Belum ada rekap untuk tanggal ini' });
        }

        // Calculate totals
        const itemsTotal = procurementSession.items.reduce((sum, item) => {
            if (item.costPrice && item.isPurchased) {
                return sum + (Number(item.costPrice) * item.totalQty);
            }
            return sum;
        }, 0);

        const expensesTotal = procurementSession.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

        return NextResponse.json({
            session: {
                ...procurementSession,
                itemsTotal,
                expensesTotal,
                grandTotal: itemsTotal + expensesTotal
            }
        });
    } catch (error) {
        console.error('Error fetching procurement session:', error);
        return NextResponse.json({ error: 'Failed to fetch procurement session' }, { status: 500 });
    }
}

// POST - Generate/Regenerate procurement session from orders
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || !['admin', 'user'].includes((session.user as any)?.role || '')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { date } = await request.json();

        // Parse date or use today
        const targetDate = new Date(date || new Date());
        targetDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Get all orders from that day that need to be processed (PENDING, CONFIRMED, PROCESSING)
        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: targetDate,
                    lt: nextDay
                },
                status: {
                    in: ['PENDING', 'CONFIRMED', 'PREPARING']
                }
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: { id: true, costPrice: true }
                        }
                    }
                }
            }
        });

        // Aggregate items by productId + unit
        const itemsMap: Record<string, {
            productId: string | null;
            productName: string;
            unit: string;
            totalQty: number;
            costPrice: number | null;
        }> = {};

        orders.forEach(order => {
            order.items.forEach(item => {
                const key = `${item.productId || item.productName}_${item.unit}`;

                if (!itemsMap[key]) {
                    itemsMap[key] = {
                        productId: item.productId,
                        productName: item.productName,
                        unit: item.unit,
                        totalQty: 0,
                        costPrice: item.product?.costPrice ? Number(item.product.costPrice) : null
                    };
                }

                itemsMap[key].totalQty += item.qty;
            });
        });

        // Upsert procurement session
        const procurementSession = await prisma.procurementSession.upsert({
            where: { date: targetDate },
            create: {
                date: targetDate,
                status: 'OPEN',
                items: {
                    create: Object.values(itemsMap).map(item => ({
                        productId: item.productId,
                        productName: item.productName,
                        unit: item.unit,
                        totalQty: item.totalQty,
                        costPrice: item.costPrice
                    }))
                }
            },
            update: {
                status: 'OPEN',
                // Delete old items and recreate
                items: {
                    deleteMany: {},
                    create: Object.values(itemsMap).map(item => ({
                        productId: item.productId,
                        productName: item.productName,
                        unit: item.unit,
                        totalQty: item.totalQty,
                        costPrice: item.costPrice
                    }))
                }
            },
            include: {
                items: true,
                expenses: true
            }
        });

        return NextResponse.json({
            session: procurementSession,
            ordersProcessed: orders.length,
            itemsCreated: Object.keys(itemsMap).length
        });
    } catch (error) {
        console.error('Error generating procurement session:', error);
        return NextResponse.json({ error: 'Failed to generate procurement session' }, { status: 500 });
    }
}

// PATCH - Update session status or notes
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || !['admin', 'user'].includes((session.user as any)?.role || '')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, status, notes } = await request.json();

        const updated = await prisma.procurementSession.update({
            where: { id },
            data: {
                ...(status && { status }),
                ...(notes !== undefined && { notes })
            }
        });

        return NextResponse.json({ session: updated });
    } catch (error) {
        console.error('Error updating procurement session:', error);
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }
}
