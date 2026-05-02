import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/r/(.*)',
  '/embed.js',
  '/datenschutz',
  '/api/public/(.*)',
  '/api/webhooks/(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const res = NextResponse.next();

  // Iframe-Embedding für /r/[slug] erlauben
  if (req.nextUrl.pathname.startsWith('/r/')) {
    res.headers.delete('x-frame-options');
    res.headers.set('Content-Security-Policy', 'frame-ancestors *');
  }

  // CORS für embed.js
  if (req.nextUrl.pathname === '/embed.js') {
    res.headers.set('Access-Control-Allow-Origin', '*');
  }

  return res;
}, {
  // Skip Auth komplett für public routes
  publicRoutes: ['/', '/sign-in(.*)', '/sign-up(.*)', '/r/(.*)', '/embed.js', '/datenschutz', '/api/public/(.*)', '/api/webhooks/(.*)'],
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
