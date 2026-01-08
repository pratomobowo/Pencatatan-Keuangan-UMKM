import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/transactions - Get all transactions
export async function GET() {
    try {
        const transactions = await prisma.transaction.findMany({
            orderBy: { date: 'desc' },
        });
        return NextResponse.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transactions' },
            { status: 500 }
        );
    }
}

// POST /api/transactions - Create new transaction
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { date, type, amount, category, description, orderId } = body;

        const transaction = await prisma.transaction.create({
            data: {
                date: date ? new Date(date) : new Date(),
                type,
                amount,
                category,
                description,
                orderId,
            },
        });

        return NextResponse.json(transaction, { status: 201 });
    } catch (error) {
        console.error('Error creating transaction:', error);
        return NextResponse.json(
            { error: 'Failed to create transaction' },
            { status: 500 }
        );
    }
}
