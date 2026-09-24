export interface Profile {
  id: string
  username: string
}

export interface Bar {
  id: string
  name: string
  city: string | null
  lat: number | null
  lng: number | null
  osm_id?: string | null
  checkins?: number
}

export interface Checkin {
  id: string
  user_id: string
  beer_name: string
  brewery: string | null
  style: string
  abv: number | null
  rating: number
  note: string | null
  bar_id: string | null
  photo_path: string | null
  created_at: string
  profiles: { username: string } | null
  bars: { id: string; name: string } | null
  cheers: { user_id: string }[]
}

// El FK explícito es obligatorio: profiles también es alcanzable vía cheers (many-to-many) y PostgREST da PGRST201.
export const CHECKIN_SELECT = '*, profiles!checkins_user_id_fkey(username), bars(id, name), cheers(user_id)'

export type Ruta =
  | { v: 'feed' }
  | { v: 'nuevo' }
  | { v: 'bares' }
  | { v: 'bar'; id: string }
  | { v: 'ranking' }
  | { v: 'perfil'; id?: string }
