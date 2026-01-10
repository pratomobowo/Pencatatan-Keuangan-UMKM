import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// POST /api/shop/vouchers/validate - Validate a voucher code
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { code } = data;

        if (!code) {
            return NextResponse.json({ error: 'Kode voucer harus diisi' }, { status: 400 });
        }

        const customer = await (prisma as any).customer.findUnique({
            where: { email: session.user.email }
        });

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        const voucher = await (prisma as any).voucher.findUnique({
            where: { code },
            include: { product: true }
        });

        if (!voucher) {
            return NextResponse.json({ error: 'Voucer tidak valid' }, { status: 404 });
        }

        if (voucher.customerId !== customer.id) {
            return NextResponse.json({ error: 'Voucer ini bukan milik Anda' }, { status: 403 });
        }

        if (voucher.isUsed) {
            return NextResponse.json({ error: 'Voucer sudah digunakan' }, { status: 400 });
        }

        if (voucher.expiryDate && new Date(voucher.expiryDate) < new Date()) {
            return NextResponse.json({ error: 'Voucer sudah kedaluwarsa' }, { status: 400 });
        }

        return NextResponse.json({
            valid: true,
            voucher: {
                id: voucher.id,
                code: voucher.code,
                type: voucher.type,
                value: Number(voucher.value),
                productId: voucher.productId,
                productName: voucher.product?.name
            }
        });

    } catch (error) {
        console.error('Error validating voucher:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
