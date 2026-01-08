import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/cost-components - Get all cost components
export async function GET() {
    try {
        const components = await prisma.costComponent.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(components);
    } catch (error) {
        console.error('Error fetching cost components:', error);
        return NextResponse.json(
            { error: 'Failed to fetch cost components' },
            { status: 500 }
        );
    }
}

// POST /api/cost-components - Create new cost component
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, cost, unit } = body;

        const component = await prisma.costComponent.create({
            data: {
                name,
                cost,
                unit,
            },
        });

        return NextResponse.json(component, { status: 201 });
    } catch (error) {
        console.error('Error creating cost component:', error);
        return NextResponse.json(
            { error: 'Failed to create cost component' },
            { status: 500 }
        );
    }
}
