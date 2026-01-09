import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCustomerFromToken } from '@/lib/shop-auth';
import bcrypt from 'bcryptjs';

// POST /api/shop/customers/me/password - Change password
export async function POST(request: NextRequest) {
    try {
        const tokenData = await getCustomerFromToken(request);

        if (!tokenData) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Password harus diisi' }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'Password baru minimal 8 karakter' }, { status: 400 });
        }

        const customer = await prisma.customer.findFirst({
            where: {
                OR: [
                    { id: tokenData.userId },
                    { email: tokenData.identifier }
                ]
            } as any
        }) as any;

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        // Check if customer has a password
        if (!customer.password) {
            return NextResponse.json({ error: 'Akun ini tidak memiliki password (Login via OTP/Google)' }, { status: 400 });
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, customer.password);
        if (!isValid) {
            return NextResponse.json({ error: 'Password saat ini salah' }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await (prisma as any).customer.update({
            where: { id: customer.id },
            data: { password: hashedPassword }
        });

        return NextResponse.json({ message: 'Password berhasil diubah' });
    } catch (error) {
        console.error('Error changing password:', error);
        return NextResponse.json({ error: 'Gagal mengubah password' }, { status: 500 });
    }
}
