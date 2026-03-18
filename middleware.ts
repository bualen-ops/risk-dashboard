import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyBasicAuth } from '@/lib/webAuth';

function unauthorizedResponse() {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Risk Dashboard"',
    },
  });
}

export function middleware(req: NextRequest) {
  // Allow simple health checks without auth
  if (req.nextUrl.pathname === '/api/health') {
    return NextResponse.next();
  }

  const { ok, user } = verifyBasicAuth(req.headers.get('authorization'));
  if (!ok || !user) {
    return unauthorizedResponse();
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-rd-user', user.username);
  requestHeaders.set('x-rd-role', user.role);
  if (user.displayName) requestHeaders.set('x-rd-display-name', user.displayName);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Apply to all routes except static assets.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

