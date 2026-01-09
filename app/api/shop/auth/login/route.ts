import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'shop-customer-secret-key-change-in-production'
);

// POST /api/shop/auth/login - Login shop customer
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone, password } = body;

        // Validate required fields
        if (!phone || !password) {
            return NextResponse.json(
                { error: 'Nomor HP dan password harus diisi' },
                { status: 400 }
            );
        }

        // Find customer by phone
        const customer = await prisma.shopCustomer.findUnique({
            where: { phone },
        });

        if (!customer) {
            return NextResponse.json(
                { error: 'Nomor HP atau password salah' },
                { status: 401 }
            );
        }

        // Verify password
        const isValid = await bcrypt.compare(password, customer.password);

        if (!isValid) {
            return NextResponse.json(
                { error: 'Nomor HP atau password salah' },
                { status: 401 }
            );
        }

        // Generate JWT token
        const token = await new SignJWT({
            customerId: customer.id,
            phone: customer.phone
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(JWT_SECRET);

        // Create response with cookie
        const response = NextResponse.json({
            message: 'Login berhasil',
            customer: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
            },
        });

        // Set HTTP-only cookie
        response.cookies.set('shop-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;
    } catch (error: any) {
        console.error('Error logging in:', error);
        return NextResponse.json(
            { error: 'Gagal login' },
            { status: 500 }
        );
    }
}
