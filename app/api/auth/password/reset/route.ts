import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { getJwtSecret } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { resetToken, newPassword } = await request.json();

        if (!resetToken || !newPassword) {
            return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
        }

        // Verify the reset token
        let payload;
        try {
            const secret = getJwtSecret();
            const verified = await jwtVerify(resetToken, secret);
            payload = verified.payload as { phone: string; purpose: string };
        } catch (err) {
            return NextResponse.json({ error: 'Sesi reset password sudah habis atau tidak valid.' }, { status: 401 });
        }

        if (payload.purpose !== 'password_reset') {
            return NextResponse.json({ error: 'Token tidak valid untuk reset password.' }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update customer password
        await prisma.customer.update({
            where: { phone: payload.phone },
            data: { password: hashedPassword },
        });

        return NextResponse.json({
            success: true,
            message: 'Password Bunda berhasil diperbarui!'
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
