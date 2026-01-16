import { NextRequest, NextResponse } from 'next/server';
import { ChatbotService, ChatMessage } from '@/services/chatbotService';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { getJwtSecret } from '@/lib/jwt';

const JWT_SECRET = getJwtSecret();

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('id');

        if (!conversationId) {
            return NextResponse.json({ error: 'Conversation ID dibutuhkan' }, { status: 400 });
        }

        const conversation = await prisma.aIChatConversation.findUnique({
            where: { id: conversationId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!conversation) {
            return NextResponse.json({ error: 'Percakapan tidak ditemukan' }, { status: 404 });
        }

        // Security check: If it's a customer conversation, ensure the session owner matches
        // (Note: Anonymous visitors will skip this if customerId is null)
        const session = await auth();
        if (conversation.customerId && conversation.customerId !== (session?.user as any)?.id) {
            // Check if customer email matches too (due to the User/Customer ID distinction fix)
            const customer = await prisma.customer.findFirst({
                where: { email: session?.user?.email || '' }
            });

            if (!customer || conversation.customerId !== customer.id) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        return NextResponse.json({
            messages: conversation.messages.map(m => ({
                role: m.role,
                content: m.content
            }))
        });
    } catch (error: any) {
        console.error('Fetch Chat History Error:', error);
        return NextResponse.json({ error: 'Gagal memuat riwayat chat' }, { status: 500 });
    }
}

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
            // Resolve customerId from session email if available
            let resolvedCustomerId: string | null = null;
            if (session?.user?.email) {
                const customer = await prisma.customer.findFirst({
                    where: { email: session.user.email }
                });
                if (customer) {
                    resolvedCustomerId = customer.id;
                }
            }

            const newConversation = await prisma.aIChatConversation.create({
                data: {
                    customerId: resolvedCustomerId,
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
        const rawProducts = await prisma.product.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                price: true,
                unit: true,
                isPromo: true,
                promoPrice: true,
                variants: {
                    select: {
                        price: true,
                        unit: true,
                    }
                }
            }
        });

        // Calculate display price (lowest variant price or base price)
        const products = rawProducts.map(p => {
            let displayPrice = Number(p.price) || 0;
            let displayUnit = p.unit;

            // If product has variants, use the lowest variant price
            if (p.variants && p.variants.length > 0) {
                const lowestVariant = p.variants.reduce((min, v) =>
                    Number(v.price) < Number(min.price) ? v : min
                    , p.variants[0]);
                displayPrice = Number(lowestVariant.price);
                displayUnit = lowestVariant.unit;
            }

            // If promo is active, use promo price
            if (p.isPromo && p.promoPrice) {
                displayPrice = Number(p.promoPrice);
            }

            return {
                id: p.id,
                name: p.name,
                price: displayPrice,
                unit: displayUnit,
                isPromo: p.isPromo,
                promoPrice: p.promoPrice,
            };
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
