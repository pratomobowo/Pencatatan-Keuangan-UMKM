import { NextRequest, NextResponse } from 'next/server';
import { ChatbotService, ChatMessage } from '@/services/chatbotService';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        const body = await request.json();
        const { messages, conversationId: existingConversationId } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: 'Format pesan tidak valid.' },
                { status: 400 }
            );
        }

        const lastUserMessage = messages[messages.length - 1]?.content;

        let conversationId = existingConversationId;
        if (!conversationId) {
            const newConversation = await prisma.aIChatConversation.create({
                data: {
                    customerId: session?.user?.id || null, // Best effort
                    title: lastUserMessage?.slice(0, 50) || 'New Conversation',
                }
            });
            conversationId = newConversation.id;
        }

        // 2. Log User Message
        await prisma.aIChatMessage.create({
            data: {
                conversationId,
                role: 'user',
                content: lastUserMessage || '',
            }
        });

        // 3. Get AI Response
        const recentMessages: ChatMessage[] = messages.slice(-10);
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

        // 4. Log Assistant Response
        await prisma.aIChatMessage.create({
            data: {
                conversationId,
                role: 'assistant',
                content: response,
            }
        });

        return NextResponse.json({ response, conversationId });
    } catch (error: any) {
        console.error('AI Chat Error:', error);
        return NextResponse.json(
            { error: error.message || 'Terjadi kesalahan sistem.' },
            { status: 500 }
        );
    }
}
