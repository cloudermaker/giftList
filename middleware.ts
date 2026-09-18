import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME } from './lib/auth/authService';

// Vérification HMAC du cookie signé « payload.signature » (WebCrypto : runtime Edge)
const isValidSession = async (rawCookieValue: string): Promise<boolean> => {
    try {
        const [payload, signature] = decodeURIComponent(rawCookieValue).split('.');
        if (!payload || !signature) return false;

        const secret = process.env.SESSION_SECRET || 'malistedecadeaux-dev-secret';
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
            'sign'
        ]);
        const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
        const expected = btoa(String.fromCharCode(...new Uint8Array(mac)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        return expected === signature;
    } catch {
        return false;
    }
};

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

    const rawCookieValue = request.cookies.get(COOKIE_NAME)?.value ?? '';
    const isAuthenticated = rawCookieValue !== '' && (await isValidSession(rawCookieValue));

    if (!isAuthenticated) {
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

// List secured path to check (backoffice manages its own backoffice_session auth)
export const config = {
    matcher: ['/', '/home', '/group/:path*', '/giftList/:path*', '/takenGiftList/:path*', '/maintenance']
};
