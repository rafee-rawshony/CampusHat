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
    '/orders'
]
const authRoutes = ['/auth/login', '/auth/register']

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const token = request.cookies.get('campushat-auth')?.value

    // Parse token from localStorage-persisted cookie
    let hasToken = false
    if (token) {
        try {
            const parsed = JSON.parse(token)
            hasToken = !!parsed?.state?.accessToken
        } catch {
            hasToken = false
        }
    }

    // Redirect unauthenticated users from protected routes
    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
    if (isProtected && !hasToken) {
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Redirect authenticated users away from auth pages
    if (authRoutes.some((route) => pathname.startsWith(route)) && hasToken) {
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
