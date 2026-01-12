import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/customers/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                orders: {
                    include: {
                        items: true,
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!customer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(customer);
    } catch (error) {
        console.error('Error fetching customer:', error);
        return NextResponse.json(
            { error: 'Failed to fetch customer' },
            { status: 500 }
        );
    }
}

// PUT /api/customers/[id]
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Sanitize data: remove relations and read-only fields that Prisma doesn't like in direct updates
        const {
            id: _id,
            createdAt: _createdAt,
            updatedAt: _updatedAt,
            orders: _orders,
            addresses: _addresses,
            pointsHistory: _pointsHistory,
            rewardRedemptions: _rewardRedemptions,
            _count: _count,
            ...updateData
        } = body;

        const customer = await prisma.customer.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(customer);
    } catch (error: any) {
        console.error('Error updating customer:', error);

        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to update customer' },
            { status: 500 }
        );
    }
}

// DELETE /api/customers/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.customer.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Customer deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting customer:', error);

        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to delete customer' },
            { status: 500 }
        );
    }
}
