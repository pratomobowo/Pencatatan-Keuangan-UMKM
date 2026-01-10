import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLoyaltyConfig } from '@/lib/loyalty';

export async function GET() {
    try {
        const config = await getLoyaltyConfig();
        return NextResponse.json(config);
    } catch (error) {
        console.error('Failed to fetch loyalty config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
