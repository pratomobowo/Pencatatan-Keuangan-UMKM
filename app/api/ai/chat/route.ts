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
                stock: true,
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

            // Include all variants for AI to choose best match
            const variantsList = p.variants?.map(v => ({
                unit: v.unit,
                price: Number(v.price)
            })) || [];

            return {
                id: p.id,
                name: p.name,
                price: displayPrice,
                unit: displayUnit,
                stock: p.stock,
                isPromo: p.isPromo,
                promoPrice: p.promoPrice,
                variants: variantsList,
            };
        });

        // Get customer context for AI (expanded with full profile & history)
        interface CustomerContext {
            isLoggedIn: boolean;
            name?: string;
            phone?: string;
            address?: string;
            cartItems?: number;
            loyaltyPoints?: number;
            loyaltyTier?: string;
            purchaseHistory?: string[];
            topProducts?: string[];
            favorites?: string[];
            lastOrderDate?: string;
            totalOrders?: number;
        }

        let customerContext: CustomerContext = { isLoggedIn: false };

        if (session?.user?.email) {
            const customer = await prisma.customer.findFirst({
                where: { email: session.user.email },
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    points: true,
                    tier: true,
                    addresses: {
                        where: { isDefault: true },
                        take: 1,
                        select: { address: true, label: true }
                    }
                }
            });

            if (customer) {
                customerContext.isLoggedIn = true;
                customerContext.name = customer.name || undefined;
                customerContext.phone = customer.phone || undefined;
                customerContext.loyaltyPoints = customer.points || 0;
                customerContext.loyaltyTier = customer.tier || 'bronze';

                if (customer.addresses?.[0]) {
                    customerContext.address = customer.addresses[0].label + ': ' + customer.addresses[0].address;
                }

                // Get cart items count
                const cart = await prisma.cart.findFirst({
                    where: { customerId: customer.id },
                    include: { items: true }
                });
                if (cart?.items) {
                    customerContext.cartItems = cart.items.length;
                }

                // Get purchase history (last 5 orders)
                const recentOrders = await prisma.order.findMany({
                    where: { customerId: customer.id },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    select: {
                        createdAt: true,
                        items: {
                            select: { productName: true, qty: true }
                        }
                    }
                });

                if (recentOrders.length > 0) {
                    customerContext.totalOrders = recentOrders.length;
                    customerContext.lastOrderDate = recentOrders[0].createdAt.toLocaleDateString('id-ID');

                    // Count product frequencies to find top products
                    const productCounts: Record<string, number> = {};
                    recentOrders.forEach(order => {
                        order.items.forEach(item => {
                            productCounts[item.productName] = (productCounts[item.productName] || 0) + item.qty;
                        });
                    });

                    // Get top 5 most ordered products
                    customerContext.topProducts = Object.entries(productCounts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([name]) => name);

                    // Recent purchases for context
                    customerContext.purchaseHistory = recentOrders[0].items.slice(0, 5).map(i => i.productName);
                }

                // Get favorites
                const favorites = await prisma.favorite.findMany({
                    where: { customerId: customer.id },
                    take: 5,
                    include: { product: { select: { name: true } } }
                });
                if (favorites.length > 0) {
                    customerContext.favorites = favorites.map(f => f.product.name);
                }
            }
        }

        // Get recipes for recommendation context
        const recipes = await prisma.recipe.findMany({
            where: { status: 'APPROVED' },
            take: 10,
            select: {
                id: true,
                title: true,
                ingredients: true,
            }
        });

        const recipeContext = recipes.map(r => ({
            id: r.id,
            title: r.title,
            ingredients: Array.isArray(r.ingredients)
                ? (r.ingredients as string[]).join(', ')
                : String(r.ingredients || '')
        }));

        const response = await ChatbotService.getChatCompletion(recentMessages, products, customerContext, recipeContext);

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
