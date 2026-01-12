import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOTP } from '@/lib/whatsapp';

export async function POST(request: Request) {
    try {
        const { phone } = await request.json();

        if (!phone) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
        }

        // Check if customer exists
        const customer = await prisma.customer.findUnique({
            where: { phone: phone },
        });

        if (!customer) {
            return NextResponse.json({
                error: 'Nomor HP tidak terdaftar. Silakan daftar terlebih dahulu.'
            }, { status: 404 });
        }

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Store OTP in database
        await prisma.oTP.create({
            data: {
                phone,
                code: otpCode,
                expiresAt,
            },
        });

        // Send OTP via WhatsApp
        const result = await sendOTP(phone, otpCode);

        if (!result.success) {
            return NextResponse.json({
                error: 'Gagal mengirim WhatsApp. Pastikan nomor Bunda benar atau hubungi Admin.'
            }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
