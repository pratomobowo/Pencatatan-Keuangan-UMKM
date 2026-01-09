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
        const existing = await prisma.shopCustomer.findUnique({
            where: { phone },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Nomor HP sudah terdaftar' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create customer
        const customer = await prisma.shopCustomer.create({
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
