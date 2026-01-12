import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/admin/gowa-config - Get GOWA config (admin only)
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

        return NextResponse.json(config);
    } catch (error) {
        console.error('Error fetching GOWA config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/admin/gowa-config - Update GOWA config (admin only)
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
                endpoint: data.endpoint,
                deviceId: data.deviceId,
                apiKey: data.apiKey,
                username: data.username,
                password: data.password,
            },
            create: {
                id: 'global',
                endpoint: data.endpoint,
                deviceId: data.deviceId,
                apiKey: data.apiKey,
                username: data.username,
                password: data.password,
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating GOWA config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
