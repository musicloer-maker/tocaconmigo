import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Registra la expulsión del usuario en Supabase, inhabilita su perfil
 * y cierra su sesión activa de inmediato.
 */
export async function executeUserBan(
  supabase: SupabaseClient,
  userId: string,
  reason: string
): Promise<never> {
  // 1. Registrar usuario baneado
  await supabase.from('banned_users').insert({
    user_id: userId,
    reason: reason,
  });

  // 2. Marcar perfil como no configurado / inactivo
  await supabase
    .from('profiles')
    .update({ is_configured: false })
    .eq('id', userId);

  // 3. Cerrar sesión del usuario ofensivo
  await supabase.auth.signOut();

  throw new Error('Tu cuenta ha sido suspendida por incumplir las normas de la comunidad.');
}