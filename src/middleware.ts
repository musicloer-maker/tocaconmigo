import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const pathname = url.pathname

  // 1. Definición de Rutas Privadas y Públicas
  const privateRoutes = ['/feed', '/matches', '/profile', '/dashboard', '/connections', '/messages']
  const isPrivateRoute = privateRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )
  
  // Excepción: Permite ver perfiles públicos si la ruta es /profile/[id]
  const isPublicProfileView = pathname.match(/^\/profile\/[^/]+/)

  // 2. Si no hay usuario y trata de entrar a ruta privada -> Redirigir a /login
  if (isPrivateRoute && !isPublicProfileView && !user) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 3. Si YA hay usuario e intenta ir a /login o /register -> Redirigir a /feed
  if (user && (pathname === '/login' || pathname === '/register')) {
    url.pathname = '/feed'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  // El matcher analiza todas las páginas excluyendo archivos estáticos (imágenes, CSS, JS, favicon)
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}