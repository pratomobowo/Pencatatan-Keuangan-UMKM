import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
    try {
        const config = await prisma.shopConfig.findUnique({
            where: { id: 'global' }
        });

        if (!config) {
            // Create default if doesn't exist
            const defaultConfig = await prisma.shopConfig.create({
                data: {
                    id: 'global',
                    faq: '[]',
                    paymentMethods: '[]',
                    operationalHours: '{}',
                    contactInfo: '{}'
                }
            });
            return NextResponse.json(defaultConfig);
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error('Error fetching shop config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();

        const updated = await prisma.shopConfig.upsert({
            where: { id: 'global' },
            update: {
                faq: data.faq,
                paymentMethods: data.paymentMethods,
                operationalHours: data.operationalHours,
                contactInfo: data.contactInfo
            },
            create: {
                id: 'global',
                faq: data.faq || '[]',
                paymentMethods: data.paymentMethods || '[]',
                operationalHours: data.operationalHours || '{}',
                contactInfo: data.contactInfo || '{}'
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating shop config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
