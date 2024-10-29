import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME } from './lib/auth/authService';
import { isEmpty } from 'lodash';

export async function middleware(request: NextRequest) {
    const encryptedCurrentUser = request.cookies.get(COOKIE_NAME)?.value ?? '';
    const currentUser = atob(encryptedCurrentUser);

    // This page is only to debug the groups => very touchy page
    if (request.nextUrl.pathname === '/backoffice' && request.headers.get('host') !== 'localhost:3000') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    console.log({ currentUser, pathname: request.nextUrl });

    if (isEmpty(currentUser) && request.nextUrl.pathname === '/') {
        return NextResponse.next();
    }
    if (isEmpty(currentUser)) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (!isEmpty(currentUser) && request.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/home', request.url));
    }
    if (!isEmpty(currentUser)) {
        return NextResponse.next();
    }

    return NextResponse.next();
}

// List secured path to check
export const config = {
    matcher: ['/', '/home', '/group/:path*', '/giftList/:path*', '/backoffice', '/takenGiftList/:path*']
};
