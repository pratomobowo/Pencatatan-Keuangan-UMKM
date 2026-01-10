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

        const responseText = await ChatbotService.getGenericCompletion(prompt, "Anda adalah konsultan bisnis UMKM profesional untuk Pasarantar.");

        return NextResponse.json({ analysis: responseText });

    } catch (error: any) {
        console.error('AI Analysis Error:', error);
        return NextResponse.json(
            { error: error.message || 'Gagal menghasilkan analisis.' },
            { status: 500 }
        );
    }
}
