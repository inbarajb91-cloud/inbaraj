import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // When visiting a profile page /r/[slug], set the profile_lock cookie
  if (pathname.startsWith('/r/')) {
    const slug = pathname.split('/')[2];
    if (slug) {
      const response = NextResponse.next();
      response.cookies.set('profile_lock', slug, {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
      });
      return response;
    }
  }

  // When visiting root /, check for profile_lock cookie and redirect
  if (pathname === '/') {
    const profileLock = request.cookies.get('profile_lock')?.value;
    if (profileLock) {
      const url = request.nextUrl.clone();
      url.pathname = `/r/${profileLock}`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/r/:slug*'],
};
