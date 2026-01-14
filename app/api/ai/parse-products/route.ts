import { NextRequest, NextResponse } from 'next/server';
import { ChatbotService } from '@/services/chatbotService';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // Authenticate admin
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { text } = body;

        if (!text) {
            return NextResponse.json(
                { error: 'Teks produk harus diisi.' },
                { status: 400 }
            );
        }

        const products = await ChatbotService.parseBulkProducts(text);

        return NextResponse.json({ products });
    } catch (error: any) {
        console.error('Parse Products Error:', error);
        return NextResponse.json(
            { error: error.message || 'Terjadi kesalahan saat memproses data AI.' },
            { status: 500 }
        );
    }
}
