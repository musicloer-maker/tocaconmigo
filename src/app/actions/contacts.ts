'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
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
          } catch {}
        },
      },
    }
  )
}

export async function addContact(contactId: string) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autorizado')
  }

  // Insertar en la agenda de contactos
  const { error } = await supabase
    .from('contacts')
    .insert([{ user_id: user.id, contact_id: contactId }])

  // Ignoramos el error 23505 si ya existía el contacto
  if (error && error.code !== '23505') {
    throw new Error(error.message)
  }

  // Refrescamos las vistas para que la UI actualice los botones
  revalidatePath('/feed')
  revalidatePath('/connections')

  return { success: true }
}

export async function removeContact(contactId: string) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autorizado')
  }

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('user_id', user.id)
    .eq('contact_id', contactId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/feed')
  revalidatePath('/connections')

  return { success: true }
}