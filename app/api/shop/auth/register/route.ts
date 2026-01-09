import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

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

        // Check if phone already exists
        const existing = await prisma.customer.findUnique({
            where: { phone },
        });

        if (existing) {
            // Check if customer already has a password (registered)
            if (existing.password) {
                return NextResponse.json(
                    { error: 'Nomor HP sudah terdaftar' },
                    { status: 400 }
                );
            }

            // If customer exists but has no password (manual customer), update it
            const hashedPassword = await bcrypt.hash(password, 10);

            const customer = await prisma.customer.update({
                where: { id: existing.id },
                data: {
                    name, // Update name if provided
                    password: hashedPassword,
                    email: email || existing.email,
                },
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                    createdAt: true,
                },
            });

            return NextResponse.json({
                message: 'Registrasi berhasil (Akun diaktifkan)',
                customer,
            }, { status: 201 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new customer
        const customer = await prisma.customer.create({
            data: {
                name,
                phone,
                password: hashedPassword,
                email: email || null,
            },
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                createdAt: true,
            },
        });

        return NextResponse.json({
            message: 'Registrasi berhasil',
            customer,
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error registering customer:', error);
        return NextResponse.json(
            { error: 'Gagal registrasi' },
            { status: 500 }
        );
    }
}
