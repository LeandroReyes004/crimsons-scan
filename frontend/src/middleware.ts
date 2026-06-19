import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Si estamos en desarrollo local, podemos omitir la protección (opcional)
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // Secreto configurado en las variables de entorno de Vercel
  const requiredSecret = process.env.CLOUDFLARE_SHARED_SECRET;
  
  // Si hay un secreto configurado, verificamos que la petición lo incluya
  if (requiredSecret) {
    const providedSecret = request.headers.get('x-cloudflare-secret');
    
    // Si el secreto no coincide o no existe, bloqueamos la petición
    if (providedSecret !== requiredSecret) {
      return new NextResponse('Acceso Denegado: Por favor utiliza el dominio oficial.', {
        status: 403,
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  // Aplicar el middleware a todas las rutas excepto recursos estáticos
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json).*)',
  ],
};
