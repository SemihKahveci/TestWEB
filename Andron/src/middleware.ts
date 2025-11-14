import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Production'da URL'leri rewrite et
  if (process.env.NODE_ENV === 'production') {
    const pathname = request.nextUrl.pathname;
    
    // Eğer path zaten /home ile başlıyorsa, olduğu gibi bırak
    if (pathname.startsWith('/home')) {
      return NextResponse.next();
    }
    
    // Root path için /home/ yaz
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/home/';
      return NextResponse.rewrite(url);
    }
    
    // Diğer path'ler için /home ekle
    const url = request.nextUrl.clone();
    url.pathname = `/home${pathname}`;
    return NextResponse.rewrite(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

