import { NextResponse } from 'next/server';
import { getSessionPayload } from './lib/auth';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Protect all /admin paths except /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get('user_session')?.value;
    const session = await getSessionPayload(token);
    
    const isLegacyAdmin = request.cookies.get('admin_session')?.value === 'true';

    if (!isLegacyAdmin && (!session || session.role !== 'ADMIN')) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
