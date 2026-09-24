import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { Bar } from '../types'
import { distanciaKm } from './geo'
import type { BarOsm } from './osm'

// Se traen de golpe y se filtran en cliente: para una cuadrilla son pocos cientos como mucho.
export function useBares() {
  const [bares, setBares] = useState<Bar[]>([])
  const [cargando, setCargando] = useState(true)
  useEffect(() => {
    supabase.from('bars_stats').select('id, name, city, lat, lng, osm_id, checkins')
      .order('checkins', { ascending: false }).limit(500)
      .then(({ data }) => { setBares((data ?? []) as Bar[]); setCargando(false) })
  }, [])
  return { bares, setBares, cargando }
}

/** Bar de la app o bar de OpenStreetMap todavía no guardado (id null). */
export type BarLista = (Bar | (BarOsm & { id: null; checkins: 0 })) & { km: number | null }

// Une bares propios y de OSM sin duplicar: si un bar OSM ya existe en la app, gana el de la app.
export function filtrarBares(bares: Bar[], texto: string, pos: { lat: number; lng: number } | null, osm: BarOsm[] = []): BarLista[] {
  const guardados = new Set(bares.map((b) => b.osm_id).filter(Boolean))
  const todos = [
    ...bares,
    ...osm.filter((o) => !guardados.has(o.osm_id)).map((o) => ({ ...o, id: null, checkins: 0 as const })),
  ]
  const t = texto.trim().toLowerCase()
  const lista = t ? todos.filter((b) => `${b.name} ${b.city ?? ''}`.toLowerCase().includes(t)) : todos
  const conKm = lista.map((b) => ({
    ...b,
    km: pos && b.lat != null && b.lng != null ? distanciaKm(pos, { lat: b.lat, lng: b.lng }) : null,
  })) as BarLista[]
  return pos ? conKm.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity)) : conKm
}

/** Devuelve el bar de la app correspondiente a uno de OSM, creándolo la primera vez. */
export async function guardarBarOsm(o: BarOsm): Promise<Bar> {
  const buscar = () => supabase.from('bars').select('id, name, city, lat, lng, osm_id').eq('osm_id', o.osm_id).maybeSingle()
  const existente = await buscar()
  if (existente.data) return existente.data as Bar
  const { data, error } = await supabase.from('bars')
    .insert({ name: o.name, city: o.city, lat: o.lat, lng: o.lng, osm_id: o.osm_id })
    .select('id, name, city, lat, lng, osm_id').single()
  if (!error) return data as Bar
  // Otro usuario lo creó a la vez: el índice único lo impide y basta con releerlo.
  if (error.code === '23505') {
    const again = await buscar()
    if (again.data) return again.data as Bar
  }
  throw new Error('No se pudo guardar el bar')
}

export const fmtKm = (km: number | null) => (km == null ? '' : km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`)
