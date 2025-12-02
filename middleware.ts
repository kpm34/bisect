import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Dev bypass token - must match the one in login page
const DEV_BYPASS_TOKEN = 'bisect-dev-2024';

export async function middleware(request: NextRequest) {
  // Check for dev bypass cookie in development mode
  if (process.env.NODE_ENV === 'development') {
    const devBypass = request.cookies.get('bisect_dev_bypass');
    if (devBypass?.value === DEV_BYPASS_TOKEN) {
      // Skip auth and allow request through
      return NextResponse.next({ request });
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
