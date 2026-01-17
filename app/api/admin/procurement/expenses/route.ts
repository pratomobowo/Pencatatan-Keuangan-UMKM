import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET - Fetch expenses for a session
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || !['admin', 'user'].includes((session.user as any)?.role || '')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
        }

        const expenses = await prisma.procurementExpense.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ expenses });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }
}

// POST - Add new expense
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || !['admin', 'user'].includes((session.user as any)?.role || '')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { sessionId, category, amount, description } = await request.json();

        if (!sessionId || !category || !amount) {
            return NextResponse.json({ error: 'sessionId, category, and amount are required' }, { status: 400 });
        }

        const expense = await prisma.procurementExpense.create({
            data: {
                sessionId,
                category,
                amount: parseFloat(amount),
                description
            }
        });

        return NextResponse.json({ expense });
    } catch (error) {
        console.error('Error creating expense:', error);
        return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
    }
}
