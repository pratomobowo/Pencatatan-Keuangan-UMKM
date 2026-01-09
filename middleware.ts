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

    // For shop protected routes
    const shopProtectedRoutes = ['/account'];
    const isShopProtectedRoute = shopProtectedRoutes.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    );

    if (isShopProtectedRoute) {
        const shopToken = request.cookies.get('shop-token');
        if (!shopToken) {
            const loginUrl = new URL('/login', request.url);
            // Optional: Add callbackUrl parameter
            // loginUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

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
