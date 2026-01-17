import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { code, subtotal, fullSubtotal } = await req.json();
        const calculationSubtotal = subtotal; // This is the eligible subtotal from frontend
        const validationSubtotal = fullSubtotal || subtotal; // Use full if provided, fallback to subtotal

        if (!code) {
            return NextResponse.json({ error: 'Kode kupon wajib diisi' }, { status: 400 });
        }

        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() }
        });

        // 1. Check existence
        if (!coupon) {
            return NextResponse.json({ error: 'Kupon tidak ditemukan' }, { status: 404 });
        }

        // 2. Check Active Status
        if (!coupon.isActive) {
            return NextResponse.json({ error: 'Kupon tidak aktif' }, { status: 400 });
        }

        // 3. Check Date Range
        const now = new Date();
        if (coupon.startDate && now < coupon.startDate) {
            return NextResponse.json({ error: 'Promo belum dimulai' }, { status: 400 });
        }
        if (coupon.endDate && now > coupon.endDate) {
            return NextResponse.json({ error: 'Kupon sudah kadaluarsa' }, { status: 400 });
        }

        // 4. Check Usage Limit
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            return NextResponse.json({ error: 'Kuota kupon habis' }, { status: 400 });
        }

        // 5. Check Minimum Purchase
        if (coupon.minPurchase && validationSubtotal < Number(coupon.minPurchase)) {
            return NextResponse.json({
                error: `Minimal belanja Rp ${Number(coupon.minPurchase).toLocaleString('id-ID')}`
            }, { status: 400 });
        }

        // 6. Calculate Discount
        let discount = 0;
        if (coupon.type === 'PERCENTAGE') {
            const rawDiscount = (calculationSubtotal * Number(coupon.value)) / 100;
            // Apply Max Cap if set
            if (coupon.maxDiscount && rawDiscount > Number(coupon.maxDiscount)) {
                discount = Number(coupon.maxDiscount);
            } else {
                discount = rawDiscount;
            }
        } else if (coupon.type === 'FIXED') {
            discount = Number(coupon.value);
            // Ensure fixed discount doesn't exceed calculationSubtotal? 
            // Usually fixed is fixed, but let's cap it at subtotal to be safe
            if (discount > calculationSubtotal) {
                discount = calculationSubtotal;
            }
        }

        return NextResponse.json({
            valid: true,
            code: coupon.code,
            type: coupon.type,
            discount: discount,
            message: 'Kupon berhasil digunakan!'
        });

    } catch (error: any) {
        return NextResponse.json({ error: 'Gagal memverifikasi kupon' }, { status: 500 });
    }
}
