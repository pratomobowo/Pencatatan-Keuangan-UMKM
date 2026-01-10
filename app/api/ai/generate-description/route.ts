import { NextRequest, NextResponse } from 'next/server';
import { ChatbotService } from '@/services/chatbotService';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // Authenticate admin
        // const session = await auth();
        // if (!session || (session.user as any).role !== 'admin') {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const body = await request.json();
        const { productName } = body;

        if (!productName) {
            return NextResponse.json(
                { error: 'Nama produk harus diisi.' },
                { status: 400 }
            );
        }

        const description = await ChatbotService.generateProductDescription(productName);

        return NextResponse.json({ description });
    } catch (error: any) {
        console.error('Generate Description Error:', error);
        return NextResponse.json(
            { error: error.message || 'Terjadi kesalahan saat membuat deskripsi.' },
            { status: 500 }
        );
    }
}
