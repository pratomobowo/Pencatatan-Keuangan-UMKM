import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/customers - Get all customers
export async function GET() {
    try {
        const customers = await prisma.customer.findMany({
            include: {
                orders: {
                    select: {
                        id: true,
                        orderNumber: true,
                        grandTotal: true,
                        status: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch customers' },
            { status: 500 }
        );
    }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, phone, address, notes } = body;

        const customer = await prisma.customer.create({
            data: {
                name,
                phone,
                address,
                notes,
            },
        });

        return NextResponse.json(customer, { status: 201 });
    } catch (error: any) {
        console.error('Error creating customer:', error);

        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Customer with this phone number already exists' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create customer' },
            { status: 500 }
        );
    }
}
