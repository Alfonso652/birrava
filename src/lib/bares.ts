import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { Bar } from '../types'
import { distanciaKm } from './geo'

// Se traen de golpe y se filtran en cliente: para una cuadrilla son pocos cientos como mucho.
export function useBares() {
  const [bares, setBares] = useState<Bar[]>([])
  const [cargando, setCargando] = useState(true)
  useEffect(() => {
    supabase.from('bars_stats').select('id, name, city, lat, lng, checkins')
      .order('checkins', { ascending: false }).limit(500)
      .then(({ data }) => { setBares((data ?? []) as Bar[]); setCargando(false) })
  }, [])
  return { bares, setBares, cargando }
}

export function filtrarBares(bares: Bar[], texto: string, pos: { lat: number; lng: number } | null) {
  const t = texto.trim().toLowerCase()
  const lista = t ? bares.filter((b) => `${b.name} ${b.city ?? ''}`.toLowerCase().includes(t)) : bares
  if (!pos) return lista.map((b) => ({ ...b, km: null as number | null }))
  return lista
    .map((b) => ({ ...b, km: b.lat != null && b.lng != null ? distanciaKm(pos, { lat: b.lat, lng: b.lng }) : null }))
    .sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity))
}

export const fmtKm = (km: number | null) => (km == null ? '' : km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`)
