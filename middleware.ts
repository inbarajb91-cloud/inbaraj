import { NextRequest, NextResponse } from 'next/server';

const SLUG_PATTERN = /^[a-z0-9-]{1,120}$/;

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Skip redirect when admin is previewing the base resume
  if (searchParams.get('view') === 'base') {
    return NextResponse.next();
  }

  // When visiting a profile page /r/[slug], set the profile_lock cookie
  if (pathname.startsWith('/r/')) {
    const slug = pathname.split('/')[2];
    // Don't set cookie if loaded inside an iframe (admin preview)
    const isIframe = request.headers.get('sec-fetch-dest') === 'iframe';
    if (slug && SLUG_PATTERN.test(slug) && !isIframe) {
      const response = NextResponse.next();
      response.cookies.set('profile_lock', slug, {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
      return response;
    }
  }

  // When visiting root /, check for profile_lock cookie and redirect
  if (pathname === '/') {
    const profileLock = request.cookies.get('profile_lock')?.value;
    if (profileLock && SLUG_PATTERN.test(profileLock)) {
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
