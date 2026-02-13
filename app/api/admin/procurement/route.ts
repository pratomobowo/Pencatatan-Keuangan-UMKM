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
        const startDateParam = searchParams.get('startDate') || searchParams.get('date');
        const endDateParam = searchParams.get('endDate');

        // Use consistent date parsing with explicit UTC
        const startStr = startDateParam || new Date().toLocaleDateString('en-CA');
        const endStr = endDateParam || startStr;

        // Use UTC dates for @db.Date field matching
        const startDate = new Date(`${startStr}T00:00:00Z`);
        const endDate = new Date(`${endStr}T23:59:59Z`);

        const sessions = await prisma.procurementSession.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                costPrice: true,
                                unit: true,
                                categoryName: true,
                                categories: {
                                    select: { name: true }
                                }
                            }
                        }
                    },
                    orderBy: { productName: 'asc' }
                },
                expenses: {
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { date: 'asc' }
        });

        if (sessions.length === 0) {
            return NextResponse.json({ session: null, message: 'Belum ada rekap untuk periode ini' });
        }

        // If single date, return legacy format + extended data
        // If range, return aggregated data (for now we merge items for the recap)
        const allItems: any[] = [];
        const allExpenses: any[] = [];
        let grandTotalItems = 0;
        let grandTotalExpenses = 0;

        sessions.forEach(ps => {
            ps.items.forEach(item => {
                allItems.push({
                    ...item,
                    category: item.product?.categoryName || item.product?.categories[0]?.name || 'Lainnya'
                });
                if (item.costPrice && item.isPurchased) {
                    grandTotalItems += (Number(item.costPrice) * item.totalQty);
                }
            });
            ps.expenses.forEach(exp => {
                allExpenses.push(exp);
                grandTotalExpenses += Number(exp.amount);
            });
        });

        // Current session is the first one if we need a reference id for updates
        // but for range view, we might need a different structure. 
        // For simplicity, if range, we return a virtual session.
        const procurementSession = sessions[0];

        return NextResponse.json({
            session: {
                ...procurementSession,
                items: allItems,
                expenses: allExpenses,
                itemsTotal: grandTotalItems,
                expensesTotal: grandTotalExpenses,
                grandTotal: grandTotalItems + grandTotalExpenses,
                isRange: sessions.length > 1
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

        const dateStr = date || new Date().toLocaleDateString('en-CA');
        // For @db.Date field, just use the date string parsed as UTC midnight
        const targetDate = new Date(`${dateStr}T00:00:00Z`);

        // Define exact WIB day range (GMT+7) for order query
        // 00:00 WIB = 17:00 UTC previous day
        const wibStart = new Date(`${dateStr}T00:00:00+07:00`);
        const wibEnd = new Date(`${dateStr}T23:59:59+07:00`);

        // Get all orders from that day that need to be processed
        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: wibStart,
                    lte: wibEnd
                },
                status: {
                    in: ['PENDING', 'PAID', 'CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED']
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
            customerName: string;
            notes: string | null;
            unit: string;
            totalQty: number;
            costPrice: number | null;
        }> = {};

        orders.forEach(order => {
            order.items.forEach(item => {
                // Key includes customerName and note to split rows for preparation clarity
                const key = `${item.productId || item.productName}_${item.unit}_${order.customerName}_${item.note || ''}`;

                if (!itemsMap[key]) {
                    itemsMap[key] = {
                        productId: item.productId,
                        productName: item.productName,
                        customerName: order.customerName,
                        notes: item.note,
                        unit: item.unit,
                        totalQty: 0,
                        costPrice: item.product?.costPrice ? Number(item.product.costPrice) : null
                    };
                }

                itemsMap[key].totalQty += item.qty;
            });
        });

        // Delete ALL existing sessions for this date (handles both old WIB-shifted and new UTC formats)
        // Old code stored dates with WIB offset, which shifted @db.Date back by 1 day
        await prisma.procurementSession.deleteMany({
            where: {
                OR: [
                    { date: new Date(`${dateStr}T00:00:00Z`) },       // New format: UTC midnight
                    { date: new Date(`${dateStr}T00:00:00+07:00`) },   // Old format: WIB midnight -> prev day UTC
                ]
            }
        });

        const itemsData = Object.values(itemsMap).map(item => ({
            productId: item.productId,
            productName: item.productName,
            customerName: item.customerName,
            notes: item.notes,
            unit: item.unit,
            totalQty: item.totalQty,
            costPrice: item.costPrice
        }));

        // Create fresh session with UTC date
        const procurementSession = await prisma.procurementSession.create({
            data: {
                date: targetDate,
                status: 'OPEN',
                items: { create: itemsData }
            },
            include: { items: true, expenses: true }
        });

        return NextResponse.json({
            session: procurementSession,
            ordersProcessed: orders.length,
            itemsCreated: Object.keys(itemsMap).length
        });
    } catch (error) {
        console.error('Error generating procurement session:', error);
        return NextResponse.json({ error: 'Failed to generate procurement session', details: String(error) }, { status: 500 });
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
