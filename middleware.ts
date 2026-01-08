export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    const session = await auth();

    // Check if user is authenticated
    const isAuthenticated = !!session?.user;
    const isLoginPage = request.nextUrl.pathname === '/login';

    // Redirect to login if not authenticated and not on login page
    if (!isAuthenticated && !isLoginPage) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Redirect to home if authenticated and on login page
    if (isAuthenticated && isLoginPage) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api/auth (auth endpoints)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
    ],
};
