import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ChatbotService } from '@/services/chatbotService';
import { auth } from '@/lib/auth';

export async function GET() {
    try {
        const lastReport = await prisma.aIAnalysisReport.findFirst({
            where: { type: 'BUSINESS_INSIGHTS' },
            orderBy: { createdAt: 'desc' }
        });

        if (!lastReport) return NextResponse.json({ infographic: null });

        return NextResponse.json({
            infographic: lastReport.data,
            createdAt: lastReport.createdAt
        });
    } catch (error) {
        console.error("GET Analysis Error:", error);
        return NextResponse.json({ error: "Failed to fetch cached analysis" }, { status: 500 });
    }
}

export async function POST() {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Fetch data for context
        const [transactions, orders, products, customers] = await Promise.all([
            prisma.transaction.findMany({
                take: 50,
                orderBy: { date: 'desc' }
            }),
            prisma.order.findMany({
                take: 20,
                orderBy: { createdAt: 'desc' },
                include: { items: true }
            }),
            prisma.product.findMany({
                where: { isActive: true }
            }),
            prisma.customer.findMany({
                take: 10,
                orderBy: { totalSpent: 'desc' }
            })
        ]);

        const totalTransactions = transactions.length;
        const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + Number(t.amount), 0);
        const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount), 0);

        // Filter out ALWAYS_READY products for stock analysis (they have 999999 which is not realistic)
        const finiteStockProducts = products.filter(p => p.stockStatus !== 'ALWAYS_READY');
        const alwaysReadyCount = products.filter(p => p.stockStatus === 'ALWAYS_READY').length;

        const bestSellers = finiteStockProducts
            .map(p => ({ name: p.name, stock: p.stock, unit: p.unit }))
            .sort((a, b) => b.stock - a.stock)
            .slice(0, 5);

        const lowStock = finiteStockProducts
            .filter(p => p.stock <= 5 && p.stock > 0)
            .map(p => ({ name: p.name, stock: p.stock }));

        const outOfStock = finiteStockProducts
            .filter(p => p.stock === 0)
            .map(p => ({ name: p.name }));

        const totalCustomers = await prisma.customer.count();
        const repeatCustomers = await prisma.customer.count({
            where: { orderCount: { gt: 1 } }
        });

        const summary = {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            transactionCount: totalTransactions
        };

        const prompt = `
            Sebagai sistem AI Analis UMKM 'Pasarantar', berikan analisis mendalam dalam format JSON.
            Pasarantar adalah toko UMKM yang menjual protein segar (ayam, daging, telur).
            
            FORMAT JSON YANG DIHARAPKAN:
            {
                "kpis": [
                    { "label": "Margin Laba", "value": "...%", "status": "positive|neutral|negative", "description": "..." },
                    { "label": "Efisiensi Stok", "value": "...%", "status": "...", "description": "..." },
                    { "label": "Retensi Pelanggan", "value": "...%", "status": "...", "description": "..." }
                ],
                "productAnalysis": {
                    "topPerforming": "...",
                    "suggestion": "...",
                    "chartData": [ { "name": "Produk A", "sales": 100 }, ... (Min 5 produk) ]
                },
                "inventoryHealth": {
                    "status": "Aman|Peringatan|Bahaya",
                    "summary": "...",
                    "actionItems": ["Segera restock X", "Promo cuci gudang Y"]
                },
                "strategicAdvice": [
                    { "title": "...", "content": "..." }
                ],
                "detailedReport": [
                    { "title": "Kesehatan Keuangan", "content": "..." },
                    { "title": "Analisis Produk & Stok", "content": "..." },
                    { "title": "Strategi Pelanggan", "content": "..." },
                    { "title": "Efisiensi Operasional", "content": "..." }
                ]
            }
            
            DATA OPERASIONAL:
            - Ringkasan Keuangan: ${JSON.stringify(summary)}
            - Produk Stok Tertinggi: ${JSON.stringify(bestSellers)}
            - Produk Stok Menipis (perlu restock): ${JSON.stringify(lowStock)}
            - Produk Stok Habis: ${JSON.stringify(outOfStock)}
            - Produk Unlimited/Selalu Ready: ${alwaysReadyCount} produk (tidak perlu dimonitor stoknya)
            - Statistik Pelanggan: Total ${totalCustomers}, Repeat ${repeatCustomers} (${totalCustomers > 0 ? ((repeatCustomers / totalCustomers) * 100).toFixed(1) : 0}%)
            
            Berikan JSON yang valid. Jangan ada teks lain di luar block JSON.
        `;

        const responseText = await ChatbotService.getGenericCompletion(prompt, "Anda adalah AI Analis yang menghasilkan output dalam format JSON valid saja.");

        // Attempt to parse JSON, if it fails, return standard markdown in analysis field
        try {
            // Clean AI response if it contains markdown code blocks
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const infographicData = JSON.parse(cleanJson);

            // SAVE to database
            await prisma.aIAnalysisReport.create({
                data: {
                    data: infographicData,
                    type: 'BUSINESS_INSIGHTS'
                }
            });

            return NextResponse.json({
                infographic: infographicData,
                createdAt: new Date()
            });
        } catch (e) {
            console.error("Failed to parse AI JSON response:", responseText);
            return NextResponse.json({ analysis: responseText });
        }
    } catch (error) {
        console.error("Analysis API Error:", error);
        return NextResponse.json({ error: "Gagal menghubungkan ke AI. Silakan coba lagi." }, { status: 500 });
    }
}
