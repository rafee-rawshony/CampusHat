import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = [
    '/seller',
    '/dashboard/seller',
    '/admin',
    '/moderator',
    '/account',
    '/wallet',
    '/wishlist',
    '/marketplace/post',
    '/marketplace/chat',
    '/checkout',
    '/orders',
]

/**
 * The `refresh_token` cookie is the only reliable signal that a user has an
 * active session. It is HttpOnly (set by the backend on login) and lives for
 * 7 days. The short-lived access token expires in ~15 minutes, so relying on
 * it here would bounce users to /auth/login too aggressively.
 */
const SESSION_COOKIE = 'refresh_token'

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const hasSession = !!request.cookies.get(SESSION_COOKIE)?.value

    // Canonical seller dashboard URL:
    // - user-facing path: /dashboard/seller/*
    // - app route remains under /seller/* (rewritten internally)
    if (pathname === '/seller' || pathname.startsWith('/seller/')) {
        const target = request.nextUrl.clone()
        target.pathname = pathname.replace(/^\/seller/, '/dashboard/seller')
        return NextResponse.redirect(target)
    }

    // Redirect unauthenticated users from protected routes
    const isProtected = protectedRoutes.some((route) =>
        pathname.startsWith(route)
    )
    if (isProtected && !hasSession) {
        // Clone the current URL so the redirect preserves the correct host + port
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/auth/login'
        loginUrl.search = ''
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    if (pathname === '/dashboard/seller' || pathname.startsWith('/dashboard/seller/')) {
        const rewriteUrl = request.nextUrl.clone()
        rewriteUrl.pathname = pathname.replace(/^\/dashboard\/seller/, '/seller')
        return NextResponse.rewrite(rewriteUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/seller/:path*',
        '/dashboard/seller/:path*',
        '/admin/:path*',
        '/account/:path*',
        '/wallet',
        '/wallet/:path*',
        '/wishlist',
        '/marketplace/post',
        '/marketplace/post/:path*',
        '/marketplace/chat',
        '/marketplace/chat/:path*',
        '/checkout',
        '/orders/:path*',
    ],
}
