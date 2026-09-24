import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const configurado = Boolean(url && key)

// Con placeholders si falta config: App muestra el aviso en vez de romper al arrancar.
export const supabase = createClient(url ?? 'http://localhost', key ?? 'anon')

export function fotoUrl(path: string) {
  return supabase.storage.from('fotos').getPublicUrl(path).data.publicUrl
}
