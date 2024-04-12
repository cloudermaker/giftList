import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME } from './lib/auth/authService';

export async function middleware(request: NextRequest) {
    const encryptedCurrentUser = request.cookies.get(COOKIE_NAME)?.value ?? '';
    const currentUser = atob(encryptedCurrentUser);

    // This page is only to debug the groups => very touchy page
    if (request.nextUrl.pathname === '/backoffice' && request.headers.get('host') !== 'localhost:3000') {
        return NextResponse.error();
    }

    if (currentUser) {
        return NextResponse.next();
    }

    return NextResponse.redirect(new URL('/', request.url));
}

// List secured path to check
export const config = {
    matcher: ['/home', '/group/:path*', '/giftList/:path*', '/backoffice', '/takenGiftList/:path*']
};
