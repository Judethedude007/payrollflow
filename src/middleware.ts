import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/upload', '/records', '/emails'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get('payrollflow_auth')?.value;

  // Check if trying to access a protected route without auth
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  if (isProtected && authToken !== 'authenticated') {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated, redirect away from login page
  const isAuthRoute = authRoutes.some((route) => pathname === route);
  if (isAuthRoute && authToken === 'authenticated') {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Also protect API routes (except login-related)
  if (pathname.startsWith('/api/') && authToken !== 'authenticated') {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/upload/:path*',
    '/records/:path*',
    '/emails/:path*',
    '/login',
    '/api/:path*',
  ],
};
