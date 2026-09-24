import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { BarLista } from '../lib/bares'

interface Props {
  pos: { lat: number; lng: number }
  bares: BarLista[]
  onElegir: (b: BarLista) => void
}

// circleMarker en vez de L.marker: los iconos por defecto de Leaflet dependen de PNGs
// con rutas relativas que se rompen al empaquetar con Vite.
export default function MapaBares({ pos, bares, onElegir }: Props) {
  const div = useRef<HTMLDivElement>(null)
  const mapa = useRef<L.Map | null>(null)
  const capa = useRef<L.LayerGroup | null>(null)
  const elegir = useRef(onElegir)
  elegir.current = onElegir

  useEffect(() => {
    if (!div.current) return
    const m = L.map(div.current, { zoomControl: false, attributionControl: true }).setView([pos.lat, pos.lng], 15)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m)
    capa.current = L.layerGroup().addTo(m)
    mapa.current = m
    return () => { m.remove(); mapa.current = null }
    // El mapa se crea una sola vez; posición y marcadores se actualizan en los efectos de abajo.
  }, [])

  useEffect(() => {
    const m = mapa.current
    const g = capa.current
    if (!m || !g) return
    g.clearLayers()
    L.circleMarker([pos.lat, pos.lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#3b82f6', fillOpacity: 1 })
      .bindTooltip('Estás aquí').addTo(g)
    for (const b of bares) {
      if (b.lat == null || b.lng == null) continue
      const propio = b.id !== null
      const mk = L.circleMarker([b.lat, b.lng], {
        radius: propio ? 11 : 8,
        color: '#fff',
        weight: 2,
        fillColor: propio ? '#f2a900' : '#8a5a12',
        fillOpacity: 0.95,
      }).addTo(g)
      mk.bindTooltip(propio ? `${b.name} · ${b.checkins ?? 0} 🍺` : b.name)
      mk.on('click', () => elegir.current(b))
    }
  }, [pos, bares])

  useEffect(() => { mapa.current?.setView([pos.lat, pos.lng]) }, [pos])

  return <div ref={div} className="mapa" />
}
