import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME } from './lib/auth/authService';

export async function middleware(request: NextRequest) {
    // Mode maintenance (activer en production avec la variable d'environnement)
    const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
    
    if (isMaintenanceMode && request.nextUrl.pathname !== '/maintenance') {
        return NextResponse.redirect(new URL('/maintenance', request.url));
    }
    
    // Si on est sur la page de maintenance en mode maintenance, laisser passer
    if (isMaintenanceMode && request.nextUrl.pathname === '/maintenance') {
        return NextResponse.next();
    }
    
    if (!isMaintenanceMode && request.nextUrl.pathname === '/maintenance') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    const encryptedCurrentUser = request.cookies.get(COOKIE_NAME)?.value ?? '';
    const currentUser = atob(encryptedCurrentUser);

    // This page is only to debug the groups => very touchy page
    if (request.nextUrl.pathname === '/backoffice' && request.headers.get('host') !== 'localhost:3000') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (currentUser === '') {
        if (request.nextUrl.pathname === '/') {
            return NextResponse.next();
        } else {
            return NextResponse.redirect(new URL('/', request.url));
        }
    } else {
        if (request.nextUrl.pathname === '/') {
            return NextResponse.redirect(new URL('/home', request.url));
        } else {
            return NextResponse.next();
        }
    }
}

// List secured path to check
export const config = {
    matcher: ['/', '/home', '/group/:path*', '/giftList/:path*', '/backoffice', '/takenGiftList/:path*', '/maintenance']
};
