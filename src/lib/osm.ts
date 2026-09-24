export interface BarOsm {
  osm_id: string
  name: string
  city: string | null
  lat: number
  lng: number
}

type Pos = { lat: number; lng: number }

const CACHE_HORAS = 24
const enVuelo = new Map<string, Promise<BarOsm[]>>()

/**
 * Bares reales alrededor de una posición, desde OpenStreetMap. Nominatim es la fuente
 * principal (rápida y estable); Overpass queda de respaldo porque su instancia pública
 * se satura a menudo y devuelve 504. Ambos son gratuitos con uso justo, de ahí la
 * caché por zona (~100 m) y la deduplicación de peticiones simultáneas.
 */
export function baresCercaOsm(pos: Pos, radio = 1000): Promise<BarOsm[]> {
  const clave = `osm:${pos.lat.toFixed(3)},${pos.lng.toFixed(3)},${radio}`
  const guardado = leerCache(clave)
  if (guardado) return Promise.resolve(guardado)
  const pendiente = enVuelo.get(clave)
  if (pendiente) return pendiente

  const p = (async () => {
    let bares: BarOsm[]
    try {
      bares = await nominatim(pos, radio)
    } catch {
      try {
        bares = await overpass(pos, radio)
      } catch {
        throw new Error('El mapa de bares no responde ahora. Puedes buscar por nombre o crear el bar.')
      }
    }
    escribirCache(clave, bares)
    return bares
  })().finally(() => enVuelo.delete(clave))

  enVuelo.set(clave, p)
  return p
}

async function conTimeout(url: string, ms: number) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    // GET sin cabeceras propias = petición "simple": evita el preflight CORS.
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(t)
  }
}

interface ResultadoNominatim {
  osm_type: string
  osm_id: number
  name: string
  lat: string
  lon: string
  address?: Record<string, string>
}

async function nominatim(pos: Pos, radio: number): Promise<BarOsm[]> {
  const dLat = radio / 111320
  const dLng = radio / (111320 * Math.cos((pos.lat * Math.PI) / 180))
  const viewbox = [pos.lng - dLng, pos.lat + dLat, pos.lng + dLng, pos.lat - dLat].map((n) => n.toFixed(5)).join(',')
  const pedir = (amenity: string) =>
    conTimeout(
      `https://nominatim.openstreetmap.org/search?amenity=${amenity}&viewbox=${viewbox}&bounded=1&format=jsonv2&addressdetails=1&limit=40&accept-language=es`,
      10000,
    ) as Promise<ResultadoNominatim[]>

  const bares = await pedir('bar')
  // La política de Nominatim pide como máximo 1 petición por segundo.
  await new Promise((r) => setTimeout(r, 1100))
  const pubs = await pedir('pub').catch(() => [])

  const vistos = new Set<string>()
  const lista: BarOsm[] = []
  for (const r of [...bares, ...pubs]) {
    const osm_id = `${r.osm_type}/${r.osm_id}`
    if (!r.name || vistos.has(osm_id)) continue
    vistos.add(osm_id)
    const a = r.address ?? {}
    lista.push({
      osm_id,
      name: r.name.slice(0, 80),
      city: (a.city ?? a.town ?? a.village ?? a.municipality ?? null)?.slice(0, 60) ?? null,
      lat: Number(r.lat),
      lng: Number(r.lon),
    })
  }
  return lista
}

interface ElementoOverpass {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

async function overpass(pos: Pos, radio: number): Promise<BarOsm[]> {
  const q = `[out:json][timeout:10];nw["amenity"~"^(bar|pub|biergarten)$"]["name"](around:${radio},${pos.lat},${pos.lng});out center 100;`
  const json = (await conTimeout(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`, 12000)) as {
    elements: ElementoOverpass[]
  }
  const lista: BarOsm[] = []
  for (const e of json.elements) {
    const lat = e.lat ?? e.center?.lat
    const lng = e.lon ?? e.center?.lon
    const name = e.tags?.name
    if (lat == null || lng == null || !name) continue
    const city = e.tags?.['addr:city']
    lista.push({ osm_id: `${e.type}/${e.id}`, name: name.slice(0, 80), city: city ? city.slice(0, 60) : null, lat, lng })
  }
  return lista
}

// localStorage puede no existir o lanzar (modo privado): la caché es solo una ayuda.
function leerCache(clave: string): BarOsm[] | null {
  try {
    const raw = localStorage.getItem(clave)
    if (!raw) return null
    const { t, bares } = JSON.parse(raw) as { t: number; bares: BarOsm[] }
    return Date.now() - t < CACHE_HORAS * 3600_000 ? bares : null
  } catch {
    return null
  }
}

function escribirCache(clave: string, bares: BarOsm[]) {
  try {
    localStorage.setItem(clave, JSON.stringify({ t: Date.now(), bares }))
  } catch {
    // Sin espacio o sin permiso: se ignora.
  }
}
