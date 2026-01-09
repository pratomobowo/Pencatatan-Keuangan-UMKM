import { NextRequest, NextResponse } from 'next/server';

// POST /api/shop/auth/logout - Logout shop customer
export async function POST(request: NextRequest) {
    const response = NextResponse.json({
        message: 'Logout berhasil',
    });

    // Clear the auth cookie
    response.cookies.set('shop-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
    });

    return response;
}
