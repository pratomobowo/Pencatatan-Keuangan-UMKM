import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
    try {
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let config = await prisma.gowaConfig.findUnique({
            where: { id: 'global' }
        });

        if (!config) {
            config = await prisma.gowaConfig.create({
                data: { id: 'global' }
            });
        }

        return NextResponse.json({
            adminPhones: config.adminPhones || [],
            notifyCustomer: config.notifyCustomer,
            notifyAdmin: config.notifyAdmin,
            adminTemplate: config.adminTemplate || '',
            customerTemplate: config.customerTemplate || '',
        });
    } catch (error) {
        console.error('Error fetching notification config:', error);
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

        const updated = await prisma.gowaConfig.upsert({
            where: { id: 'global' },
            update: {
                adminPhones: data.adminPhones,
                notifyCustomer: data.notifyCustomer,
                notifyAdmin: data.notifyAdmin,
                adminTemplate: data.adminTemplate,
                customerTemplate: data.customerTemplate,
            },
            create: {
                id: 'global',
                adminPhones: data.adminPhones || [],
                notifyCustomer: data.notifyCustomer !== undefined ? data.notifyCustomer : true,
                notifyAdmin: data.notifyAdmin !== undefined ? data.notifyAdmin : true,
                adminTemplate: data.adminTemplate || '',
                customerTemplate: data.customerTemplate || '',
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating notification config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
