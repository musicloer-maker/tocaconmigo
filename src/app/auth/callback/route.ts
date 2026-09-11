import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Si viene un parámetro 'next', redirigimos ahí; de lo contrario, al feed por defecto
  const next = searchParams.get('next') ?? '/feed'

  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // El bloque try-catch previene errores si los cookies se establecen desde un Server Component
            }
          },
        },
      }
    )

    // Intercambia el código temporal enviado por Supabase por una sesión activa de usuario
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Si la autenticación es exitosa, redirige a la ruta privada deseada (por defecto /feed)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si hubo un error o no había código de verificación, se redirige al login con aviso
  return NextResponse.redirect(`${origin}/login?error=No%20se%20pudo%20autenticar%20la%20sesion`)
}