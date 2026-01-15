import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { StockStatus } from '@/lib/types';

export async function POST() {
    try {
        const session = await auth();
        // Check if user is admin - basic check, adjust based on your role system
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await prisma.product.updateMany({
            where: {
                stockStatus: {
                    not: StockStatus.ALWAYS_READY
                }
            },
            data: {
                stockStatus: StockStatus.ALWAYS_READY
            }
        });

        return NextResponse.json({
            success: true,
            message: `Berhasil mengubah ${result.count} produk menjadi Selalu Ready`
        });
    } catch (error: any) {
        console.error('Bulk update error:', error);
        return NextResponse.json({ error: 'Gagal update stok' }, { status: 500 });
    }
}
