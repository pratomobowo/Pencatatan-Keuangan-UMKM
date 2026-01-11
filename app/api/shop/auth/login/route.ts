import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { getJwtSecret } from '@/lib/jwt';

const JWT_SECRET = getJwtSecret();

// POST /api/shop/auth/login - Unified login for customer & admin
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone, email, password } = body;

        // Validate
        if ((!phone && !email) || !password) {
            return NextResponse.json(
                { error: 'Email/HP dan password harus diisi' },
                { status: 400 }
            );
        }

        let userType: 'admin' | 'customer' = 'customer';
        let userId: string;
        let userName: string;
        let userIdentifier: string;
        let hashedPassword: string;

        // Try to find admin user first (by email)
        if (email) {
            const adminUser = await prisma.user.findUnique({
                where: { email },
            });

            if (adminUser && adminUser.password) {
                userType = 'admin';
                userId = adminUser.id;
                userName = adminUser.name;
                userIdentifier = adminUser.email;
                hashedPassword = adminUser.password;
            }
        }

        // If not found as admin, try as shop customer (by phone)
        if (userType === 'customer') {
            const identifier = phone || email;
            // Use unified Customer model
            // Note: Currently only finding by phone as it's the unique identifier
            const customer = await prisma.customer.findFirst({
                where: {
                    OR: [
                        { phone: identifier },
                        // Optional: Allow finding by email if provided and configured
                        // { email: identifier }
                    ]
                },
            });

            if (!customer) {
                return NextResponse.json(
                    { error: 'Akun tidak ditemukan' },
                    { status: 401 }
                );
            }

            // For unified customer, password might be null (manual customer)
            if (!customer.password) {
                return NextResponse.json(
                    { error: 'Akun ini belum diaktivasi untuk login. Silakan daftar ulang.' },
                    { status: 401 }
                );
            }

            userId = customer.id;
            userName = customer.name;
            userIdentifier = customer.phone || customer.email || customer.id;
            hashedPassword = customer.password;
        }

        // Verify password
        const isValid = await bcrypt.compare(password, hashedPassword!);

        if (!isValid) {
            return NextResponse.json(
                { error: 'Password salah' },
                { status: 401 }
            );
        }

        // Generate JWT token
        const token = await new SignJWT({
            userId: userId!,
            identifier: userIdentifier!,
            type: userType,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(JWT_SECRET);

        // Create response
        const response = NextResponse.json({
            message: 'Login berhasil',
            user: {
                id: userId!,
                name: userName!,
                type: userType,
            },
            redirectTo: userType === 'admin' ? '/admin' : '/account',
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
