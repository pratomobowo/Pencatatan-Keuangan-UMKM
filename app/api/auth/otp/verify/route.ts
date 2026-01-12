import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';
import { getJwtSecret } from '@/lib/jwt';

export async function POST(request: Request) {
    try {
        const { phone, code } = await request.json();

        if (!phone || !code) {
            return NextResponse.json({ error: 'Phone and code are required' }, { status: 400 });
        }

        // Find the latest unused OTP for this phone
        const otpRecord = await prisma.oTP.findFirst({
            where: {
                phone: phone,
                code: code,
                isUsed: false,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!otpRecord) {
            return NextResponse.json({ error: 'Kode OTP salah atau sudah kadaluarsa.' }, { status: 400 });
        }

        // Mark OTP as used
        await prisma.oTP.update({
            where: { id: otpRecord.id },
            data: { isUsed: true },
        });

        // Generate a secure reset token (JWT) valid for 15 minutes
        const secret = getJwtSecret();
        const resetToken = await new SignJWT({ phone, purpose: 'password_reset' })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('15m')
            .sign(secret);

        return NextResponse.json({
            success: true,
            resetToken
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
