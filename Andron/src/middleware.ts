import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Production'da URL'leri rewrite et
  if (process.env.NODE_ENV === 'production') {
    const pathname = request.nextUrl.pathname;
    
    // Eğer path zaten /home ile başlıyorsa, olduğu gibi bırak (internal rewrite'lar için)
    if (pathname.startsWith('/home')) {
      return NextResponse.next();
    }
    
    // Static dosyalar ve API route'ları için /home prefix'i ekle (rewrite)
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/assets') ||
      pathname === '/favicon.ico'
    ) {
      const url = request.nextUrl.clone();
      url.pathname = `/home${pathname}`;
      return NextResponse.rewrite(url);
    }
    
    // Root path için /home/ yaz (rewrite - URL değişmez)
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/home/';
      return NextResponse.rewrite(url);
    }
    
    // Diğer path'ler için /home ekle (rewrite - URL değişmez)
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

