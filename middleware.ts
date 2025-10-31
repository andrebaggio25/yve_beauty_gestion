import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)
  
  const pathname = request.nextUrl.pathname

  // Allow public auth routes
  if (pathname === '/login' || pathname === '/register') {
    return response
  }
  
  // For protected routes, check if user is authenticated
  if (pathname.startsWith('/dashboard') || pathname === '/') {
    try {
      // Session validation is handled by updateSession
      return response
    } catch {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}
