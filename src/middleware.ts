import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Lista de correos autorizados para administrar la plataforma
const ADMIN_EMAILS = ['tu-email-de-admin@gmail.com']

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
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, any> }[]) {
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

  // 1. Verificación de usuarios baneados
  if (user) {
    const { data: bannedData } = await supabase
      .from('banned_users')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (bannedData) {
      await supabase.auth.signOut()
      url.pathname = '/login'
      url.searchParams.set('banned', 'true')
      return NextResponse.redirect(url)
    }
  }

  // 2. Control de acceso exclusivo a la ruta /admin
  if (pathname.startsWith('/admin')) {
    if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
      url.pathname = '/feed'
      return NextResponse.redirect(url)
    }
  }

  // 3. Control de acceso por rutas privadas
  const privateRoutes = ['/feed', '/matches', '/profile', '/dashboard', '/connections', '/messages']
  const isPrivateRoute = privateRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  // Excepción para perfiles públicos /profile/[id]
  const isPublicProfileView = pathname.match(/^\/profile\/[^/]+/)

  // Redirigir a login si intenta entrar a ruta privada sin usuario
  if (isPrivateRoute && !isPublicProfileView && !user) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirigir a feed si ya está logueado e intenta ir a auth
  if (user && (pathname === '/login' || pathname === '/register')) {
    url.pathname = '/feed'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}