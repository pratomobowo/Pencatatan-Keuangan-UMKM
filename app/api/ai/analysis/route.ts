import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ChatbotService } from '@/services/chatbotService';

export async function POST(request: NextRequest) {
    try {
        // ... (data fetching remains the same)
        const transactions = await prisma.transaction.findMany({
            orderBy: { date: 'desc' },
            take: 100,
        });

        const bestSellers = await prisma.orderItem.groupBy({
            by: ['productName', 'unit'],
            _sum: {
                qty: true,
                total: true,
            },
            orderBy: {
                _sum: {
                    qty: 'desc',
                },
            },
            take: 10,
        });

        const lowStock = await prisma.product.findMany({
            where: {
                stock: {
                    lte: 5,
                },
                isActive: true,
            },
            select: {
                name: true,
                stock: true,
                unit: true,
            },
            take: 10,
        });

        const totalCustomers = await prisma.customer.count();
        const repeatCustomers = await prisma.customer.count({
            where: {
                orderCount: {
                    gt: 1,
                },
            },
        });

        const summary = transactions.reduce((acc, curr) => {
            const type = curr.type.toString();
            if (!acc[type]) acc[type] = 0;
            acc[type] += Number(curr.amount);
            return acc;
        }, {} as Record<string, number>);

        const prompt = `
            Bertindaklah sebagai konsultan bisnis profesional untuk 'Pasarantar', sebuah bisnis UMKM yang bergerak di bidang penjualan dan pengiriman protein segar (Ikan, Seafood, Ayam, Daging) dari pasar ke rumah pelanggan.
            
            Saya akan memberikan data operasional yang komprehensif.
            
            TUGAS ANDA: Berikan analisis strategis dalam format JSON yang bisa diubah menjadi infografik.
            
            FORMAT JSON YANG DIHARAPKAN:
            {
                "kpis": [
                    { "label": "Margin Laba", "value": "25%", "status": "posistive|neutral|negative", "description": "Penjelasan singkat" },
                    { "label": "Efisiensi Biaya", "value": "Tinggi", "status": "...", "description": "..." },
                    { "label": "Retensi Pelanggan", "value": "45%", "status": "...", "description": "..." }
                ],
                "productAnalysis": {
                    "topPerforming": "Nama Produk Terlaris",
                    "suggestion": "Bundling yang disarankan",
                    "chartData": [
                        { "name": "Produk A", "sales": 100 }, ... (Maks 5 produk teratas)
                    ]
                },
                "inventoryHealth": {
                    "status": "Aman|Peringatan|Bahaya",
                    "summary": "Ringkasan kondisi stok",
                    "actionItems": ["Segera restock X", "Promo cuci gudang Y"]
                },
                "strategicAdvice": [
                    { "title": "...", "content": "..." }, ... (Maks 3 saran taktis)
                ],
                "fullNarrative": "Konten analisis mendalam dalam format Markdown (tetap disediakan sebagai opsi bacaan detail)."
            }
            
            DATA OPERASIONAL:
            - Ringkasan Keuangan: ${JSON.stringify(summary)}
            - Produk Terlaris: ${JSON.stringify(bestSellers)}
            - Stok Menipis: ${JSON.stringify(lowStock)}
            - Statistik Pelanggan: Total ${totalCustomers}, Repeat ${repeatCustomers} (${((repeatCustomers / totalCustomers) * 100).toFixed(1)}%)
            
            Berikan JSON yang valid. Jangan ada teks lain di luar block JSON.
        `;

        const responseText = await ChatbotService.getGenericCompletion(prompt, "Anda adalah AI Analis yang menghasilkan output dalam format JSON valid saja.");

        // Attempt to parse JSON, if it fails, return standard markdown in analysis field
        try {
            // Clean AI response if it contains markdown code blocks
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const infographicData = JSON.parse(cleanJson);
            return NextResponse.json({ infographic: infographicData });
        } catch (e) {
            console.error("Failed to parse AI JSON response:", responseText);
            return NextResponse.json({ analysis: responseText });
        }

    } catch (error: any) {
        console.error('AI Analysis Error:', error);
        return NextResponse.json(
            { error: error.message || 'Gagal menghasilkan analisis.' },
            { status: 500 }
        );
    }
}
