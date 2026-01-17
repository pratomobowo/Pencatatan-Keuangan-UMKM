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

        // Calculate actual bestsellers from order items (real sales data)
        const productSalesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
        orders.forEach(order => {
            order.items.forEach((item: any) => {
                const productId = item.productId;
                const productName = item.productName || 'Unknown';
                const qty = Number(item.quantity) || 0;
                const total = Number(item.total) || 0;

                if (!productSalesMap[productId]) {
                    productSalesMap[productId] = { name: productName, quantity: 0, revenue: 0 };
                }
                productSalesMap[productId].quantity += qty;
                productSalesMap[productId].revenue += total;
            });
        });

        // Convert to array and sort by quantity sold
        const bestSellers = Object.values(productSalesMap)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 8)  // Top 8 products for chart
            .map(p => ({ name: p.name, sales: p.quantity, revenue: p.revenue }));

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
                    "chartData": "GUNAKAN DATA DARI BESTSELLERS DI BAWAH (jangan generate sendiri)"
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
            - Produk Terlaris (data nyata dari order): ${JSON.stringify(bestSellers)}
            - PENTING: Untuk chartData pada productAnalysis, GUNAKAN data ini langsung: ${JSON.stringify(bestSellers.map(p => ({ name: p.name, sales: p.sales })))}
            - Produk Stok Menipis (perlu restock): ${JSON.stringify(lowStock)}
            - Produk Stok Habis: ${JSON.stringify(outOfStock)}
            - Produk Unlimited/Selalu Ready: ${alwaysReadyCount} produk (tidak perlu dimonitor stoknya)
            - Statistik Pelanggan: Total ${totalCustomers}, Repeat ${repeatCustomers} (${totalCustomers > 0 ? ((repeatCustomers / totalCustomers) * 100).toFixed(1) : 0}%)
            
            INSTRUKSI CHARTDATA: Untuk field "chartData" di productAnalysis, salin LANGSUNG array berikut tanpa modifikasi:
            ${JSON.stringify(bestSellers.map(p => ({ name: p.name, sales: p.sales })))}
            
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
