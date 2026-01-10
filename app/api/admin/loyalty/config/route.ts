import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
    try {
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let config = await (prisma as any).loyaltyConfig.findUnique({
            where: { id: 'global' }
        });

        if (!config) {
            config = await (prisma as any).loyaltyConfig.create({
                data: {
                    id: 'global',
                    pointsPerAmount: 10000,
                    pointMultiplier: 1.0,
                    minSpentSilver: 1000000,
                    minSpentGold: 5000000,
                    multiplierSilver: 1.2,
                    multiplierGold: 1.5,
                }
            });
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error('Failed to fetch loyalty config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            pointsPerAmount,
            pointMultiplier,
            minSpentSilver,
            minSpentGold,
            multiplierSilver,
            multiplierGold
        } = body;

        const config = await (prisma as any).loyaltyConfig.upsert({
            where: { id: 'global' },
            create: {
                id: 'global',
                pointsPerAmount,
                pointMultiplier,
                minSpentSilver,
                minSpentGold,
                multiplierSilver,
                multiplierGold
            },
            update: {
                pointsPerAmount,
                pointMultiplier,
                minSpentSilver,
                minSpentGold,
                multiplierSilver,
                multiplierGold
            }
        });

        return NextResponse.json(config);
    } catch (error) {
        console.error('Failed to update loyalty config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
