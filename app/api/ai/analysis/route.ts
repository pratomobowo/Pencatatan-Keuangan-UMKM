import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export async function POST(request: NextRequest) {
    try {
        // 1. Fetch Transactions
        const transactions = await prisma.transaction.findMany({
            orderBy: { date: 'desc' },
            take: 100,
        });

        // 2. Fetch Best Selling Products
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

        // 3. Fetch Low Stock Products
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

        // 4. Fetch Customer Stats
        const totalCustomers = await prisma.customer.count();
        const repeatCustomers = await prisma.customer.count({
            where: {
                orderCount: {
                    gt: 1,
                },
            },
        });

        // 5. Build Aggregated Summary
        const summary = transactions.reduce((acc, curr) => {
            const type = curr.type.toString();
            if (!acc[type]) acc[type] = 0;
            acc[type] += Number(curr.amount);
            return acc;
        }, {} as Record<string, number>);

        // 6. Construct Prompt
        const prompt = `
            Bertindaklah sebagai konsultan bisnis profesional untuk 'Pasarantar', sebuah bisnis UMKM yang bergerak di bidang penjualan dan pengiriman protein segar (Ikan, Seafood, Ayam, Daging) dari pasar ke rumah pelanggan.
            
            Saya akan memberikan data operasional yang komprehensif.
            
            Tugas Anda adalah memberikan analisis strategis untuk model bisnis "Fresh Food Delivery":
            1. **Kesehatan Keuangan**: Analisis margin berdasarkan Ringkasan Transaksi.
            2. **Analisis Produk (PENTING)**: Lihat Daftar Produk Terlaris. Apakah ada pola musiman atau preferensi tertentu? Berikan saran stok.
            3. **Peringatan Inventaris**: Analisis barang Low Stock. Apa dampaknya jika stok ini habis dan apa rekomendasinya?
            4. **Loyalitas Pelanggan**: Berdasarkan data Customer (Total: ${totalCustomers}, Repeat: ${repeatCustomers}), seberapa baik retensi pelanggan kita? Apa saran untuk meningkatkan loyalitas?
            5. **Saran Taktis**: Berikan ide konkret (misal: bundling, promo hari tertentu, rute pengiriman).
            
            Gunakan Bahasa Indonesia yang profesional, menyemangati, dan praktis (Format Markdown).
            
            DATA OPERASIONAL:
            - Ringkasan Keuangan (100 Transaksi Terakhir): ${JSON.stringify(summary)}
            - Produk Terlaris: ${JSON.stringify(bestSellers)}
            - Stok Menipis: ${JSON.stringify(lowStock)}
            - Statistik Pelanggan: Total ${totalCustomers}, Repeat Customer ${repeatCustomers} (${((repeatCustomers / totalCustomers) * 100).toFixed(1)}%)
            
            Daftar Transaksi Terakhir:
            ${JSON.stringify(transactions.slice(0, 30))}
            
            Berikan analisis yang tajam dan "to the point" agar owner bisa langsung mengambil keputusan.
        `;

        const result = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
        });
        const responseText = result.text || "Gagal menghasilkan analisis.";

        return NextResponse.json({ analysis: responseText });

    } catch (error: any) {
        console.error('AI Analysis Error:', error);
        return NextResponse.json(
            { error: error.message || 'Gagal menghasilkan analisis.' },
            { status: 500 }
        );
    }
}
