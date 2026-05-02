import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export default clerkMiddleware(async (auth, req) => {
  const res = NextResponse.next();

  // Für /r/[slug] Routes: Iframe-Embedding erlauben
  if (req.nextUrl.pathname.startsWith('/r/')) {
    res.headers.delete('x-frame-options');
    res.headers.set('Content-Security-Policy', 'frame-ancestors *');
  }

  // Für /embed.js: CORS erlauben
  if (req.nextUrl.pathname === '/embed.js') {
    res.headers.set('Access-Control-Allow-Origin', '*');
  }

  return res;
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
