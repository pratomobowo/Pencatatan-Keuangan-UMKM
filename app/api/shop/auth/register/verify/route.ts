import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/shop/auth/register/verify - Verify registration OTP
export async function POST(request: NextRequest) {
    try {
        const { phone, code } = await request.json();

        if (!phone || !code) {
            return NextResponse.json(
                { error: 'Nomor HP dan kode OTP harus diisi' },
                { status: 400 }
            );
        }

        // Clean phone number (flexible matching)
        const phoneMatch = phone.replace(/\D/g, '');

        // Find the latest unused OTP for this phone (allow some flexible matching)
        const otpRecord = await prisma.oTP.findFirst({
            where: {
                OR: [
                    { phone: phone },
                    { phone: phoneMatch },
                    { phone: '0' + phoneMatch.replace(/^62/, '') },
                    { phone: '62' + phoneMatch.replace(/^0/, '') },
                ],
                code: code,
                isUsed: false,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!otpRecord) {
            return NextResponse.json(
                { error: 'Kode OTP salah atau sudah kadaluarsa.' },
                { status: 400 }
            );
        }

        // Mark OTP as used and update customer verifiedAt in transaction
        const basePhone = phoneMatch.replace(/^(0|62)/, '');

        await prisma.$transaction([
            prisma.oTP.update({
                where: { id: otpRecord.id },
                data: { isUsed: true },
            }),
            prisma.customer.updateMany({
                where: {
                    OR: [
                        { phone: phone },
                        { phone: phoneMatch },
                        { phone: basePhone },
                        { phone: '0' + basePhone },
                        { phone: '62' + basePhone },
                    ],
                },
                data: { verifiedAt: new Date() },
            }),
        ]);

        return NextResponse.json({
            success: true,
            message: 'Verifikasi berhasil. Silakan login Bunda.',
        });
    } catch (error) {
        console.error('Error verifying registration OTP:', error);
        return NextResponse.json(
            { error: 'Gagal verifikasi OTP' },
            { status: 500 }
        );
    }
}
