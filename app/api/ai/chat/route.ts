import { NextRequest, NextResponse } from 'next/server';
import { ChatbotService, ChatMessage } from '@/services/chatbotService';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        // Optional: Check if user is authenticated
        // const session = await auth();
        // if (!session) {
        //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const body = await request.json();
        const { messages } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: 'Format pesan tidak valid.' },
                { status: 400 }
            );
        }

        // Limit previous messages to keep context efficient
        const recentMessages: ChatMessage[] = messages.slice(-10);

        // Fetch active products for AI context
        const products = await prisma.product.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                price: true,
                unit: true,
                isPromo: true,
                promoPrice: true,
            }
        });

        const response = await ChatbotService.getChatCompletion(recentMessages, products);

        return NextResponse.json({ response });
    } catch (error: any) {
        console.error('AI Chat Error:', error);
        return NextResponse.json(
            { error: error.message || 'Terjadi kesalahan sistem.' },
            { status: 500 }
        );
    }
}
