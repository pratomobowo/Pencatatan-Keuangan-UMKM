export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

// Public routes that don't require authentication
const publicRoutes = [
    '/',
    '/products',
    '/cart',
    '/login',
    '/register',
    '/api/shop',  // Shop APIs are public or handle their own auth
];

// Admin routes that require NextAuth session
const adminRoutes = [
    '/admin',
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if route is public
    const isPublicRoute = publicRoutes.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    );

    // Check if route is admin
    const isAdminRoute = adminRoutes.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    );

    // Allow public routes without any auth check
    if (isPublicRoute) {
        return NextResponse.next();
    }

    // For admin routes, check NextAuth session
    if (isAdminRoute) {
        const session = await auth();
        const isAuthenticated = !!session?.user;

        if (!isAuthenticated) {
            return NextResponse.redirect(new URL('/admin-login', request.url));
        }
    }

    // For other routes (checkout, orders, account, addresses)
    // These are protected by shop JWT auth checked in API routes/pages themselves
    // Let them through - the pages will redirect to /login if not authenticated
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api/auth (NextAuth endpoints)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public assets
         */
        '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
    ],
};
