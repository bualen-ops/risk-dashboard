import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

  const user = process.env.BASIC_AUTH_USER || '';
  const pass = process.env.BASIC_AUTH_PASS || '';

  // If creds are not set, deny by default (safer than open access)
  if (!user || !pass) {
    return unauthorizedResponse();
  }

  const authHeader = req.headers.get('authorization') || '';
  const [scheme, encoded] = authHeader.split(' ');

  if (scheme !== 'Basic' || !encoded) {
    return unauthorizedResponse();
  }

  let decoded = '';
  try {
    decoded = Buffer.from(encoded, 'base64').toString('utf8');
  } catch {
    return unauthorizedResponse();
  }

  const sepIdx = decoded.indexOf(':');
  const gotUser = sepIdx >= 0 ? decoded.slice(0, sepIdx) : '';
  const gotPass = sepIdx >= 0 ? decoded.slice(sepIdx + 1) : '';

  if (gotUser !== user || gotPass !== pass) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Apply to all routes except static assets.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

