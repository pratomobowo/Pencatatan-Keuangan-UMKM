import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendOTP } from '@/lib/whatsapp';

// POST /api/shop/auth/register - Register new shop customer
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, phone, password, email } = body;

        // Validate required fields
        if (!name || !phone || !password) {
            return NextResponse.json(
                { error: 'Nama, nomor HP, dan password harus diisi' },
                { status: 400 }
            );
        }

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Check if phone already exists (flexible lookup)
        const phoneDigits = phone.replace(/\D/g, '');
        const basePhone = phoneDigits.replace(/^(0|62)/, ''); // Strip leading 0 or 62

        const existing = await prisma.customer.findFirst({
            where: {
                OR: [
                    { phone: phone },
                    { phone: phoneDigits },
                    { phone: basePhone },
                    { phone: '0' + basePhone },
                    { phone: '62' + basePhone },
                ]
            },
        });

        if (existing) {
            // Check if customer already has a password (registered)
            if (existing.password && existing.verifiedAt) {
                return NextResponse.json(
                    { error: 'Nomor HP sudah terdaftar' },
                    { status: 400 }
                );
            }

            // If customer exists but has no password (manual customer) or is not verified
            const hashedPassword = await bcrypt.hash(password, 10);

            await prisma.$transaction([
                prisma.customer.update({
                    where: { id: existing.id },
                    data: {
                        name,
                        password: hashedPassword,
                        email: email || existing.email,
                        verifiedAt: null, // Reset verification if they are re-registering an unverified account
                    },
                }),
                prisma.oTP.create({
                    data: {
                        phone,
                        code: otpCode,
                        expiresAt,
                    },
                }),
            ]);

            // Send OTP via WhatsApp
            await sendOTP(phone, otpCode, 'register');

            return NextResponse.json({
                message: 'OTP terkirim. Silakan verifikasi nomor WhatsApp Bunda.',
                requiresVerification: true,
                phone,
            }, { status: 201 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new customer and OTP in transaction
        await prisma.$transaction([
            prisma.customer.create({
                data: {
                    name,
                    phone,
                    password: hashedPassword,
                    email: email || null,
                    verifiedAt: null,
                },
            }),
            prisma.oTP.create({
                data: {
                    phone,
                    code: otpCode,
                    expiresAt,
                },
            }),
        ]);

        // Send OTP via WhatsApp
        await sendOTP(phone, otpCode, 'register');

        return NextResponse.json({
            message: 'Registrasi berhasil. Silakan verifikasi kode OTP yang dikirim ke WhatsApp Bunda.',
            requiresVerification: true,
            phone,
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error registering customer:', error);
        return NextResponse.json(
            { error: 'Gagal registrasi' },
            { status: 500 }
        );
    }
}
