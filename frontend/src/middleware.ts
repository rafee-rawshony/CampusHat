import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = [
    '/seller',
    '/admin',
    '/moderator',
    '/account',
    '/marketplace/post',
    '/marketplace/chat',
    '/checkout',
    '/orders',
]
const authRoutes = ['/auth/login', '/auth/register']

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

    // Redirect unauthenticated users from protected routes
    const isProtected = protectedRoutes.some((route) =>
        pathname.startsWith(route)
    )
    if (isProtected && !hasSession) {
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Redirect authenticated users away from auth pages
    if (
        authRoutes.some((route) => pathname.startsWith(route)) &&
        hasSession
    ) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/seller/:path*', 
        '/admin/:path*', 
        '/account/:path*', 
        '/marketplace/post', 
        '/marketplace/post/:path*', 
        '/marketplace/chat', 
        '/marketplace/chat/:path*', 
        '/checkout', 
        '/orders/:path*', 
        '/auth/:path*'
    ],
}
