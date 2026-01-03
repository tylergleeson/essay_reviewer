import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Coach routes
    if (path.startsWith('/coach') && token?.role !== 'COACH') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Student routes
    if (path.startsWith('/dashboard') && token?.role !== 'STUDENT') {
      return NextResponse.redirect(new URL('/coach', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/coach/:path*'],
}
