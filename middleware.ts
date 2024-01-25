import { NextRequest, NextResponse } from 'next/server';
import { GROUP_ID_COOKIE, USER_ID_COOKIE } from './components/layout';

export function middleware(request: NextRequest) {
    let groupIdCookie = request.cookies.get(GROUP_ID_COOKIE);
    let userIdCookie = request.cookies.get(USER_ID_COOKIE);

    if (groupIdCookie && userIdCookie) {
        return NextResponse.next();
    }

    return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
    matcher: ['/home', '/group/:path*', '/giftList/:path*', '/backoffice']
};
