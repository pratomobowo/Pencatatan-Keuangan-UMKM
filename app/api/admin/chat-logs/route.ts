import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if ((session?.user as any)?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const conversations = await prisma.aIChatConversation.findMany({
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                },
                customer: {
                    select: {
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
            take: 50
        });

        return NextResponse.json(conversations);
    } catch (error: any) {
        console.error('Admin Chat Logs Error:', error);
        return NextResponse.json(
            { error: error.message || 'Gagal mengambil data chat.' },
            { status: 500 }
        );
    }
}
