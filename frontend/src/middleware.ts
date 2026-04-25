import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = [
    '/seller',
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

    // Redirect unauthenticated users from protected routes
    const isProtected = protectedRoutes.some((route) =>
        pathname.startsWith(route)
    )
    if (isProtected && !hasSession) {
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/seller/:path*',
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
