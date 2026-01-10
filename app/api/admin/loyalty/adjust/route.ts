import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { customerId, amount, description, type } = body;

        if (!customerId || amount === undefined || !description) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const customer = await (tx as any).customer.findUnique({
                where: { id: customerId }
            });

            if (!customer) throw new Error('Customer not found');

            const updatedCustomer = await (tx as any).customer.update({
                where: { id: customerId },
                data: {
                    points: { increment: amount }
                }
            });

            const transaction = await (tx as any).pointTransaction.create({
                data: {
                    customerId,
                    amount,
                    description,
                    type: type || 'ADJUSTED'
                }
            });

            return { updatedCustomer, transaction };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Failed to adjust loyalty points:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
