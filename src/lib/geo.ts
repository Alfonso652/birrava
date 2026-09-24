export function distanciaKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

type Pos = { lat: number; lng: number }

function pedir(opciones: PositionOptions): Promise<Pos> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      reject,
      opciones,
    ),
  )
}

function mensaje(e: GeolocationPositionError) {
  if (e.code === e.PERMISSION_DENIED) {
    return 'Permiso de ubicación denegado. Actívalo en los ajustes del navegador para este sitio (icono del candado junto a la dirección).'
  }
  if (e.code === e.POSITION_UNAVAILABLE) return 'El móvil no da ubicación. Comprueba que el GPS/Ubicación está activado.'
  return 'La ubicación tarda demasiado. Prueba otra vez o acércate a una ventana.'
}

// Primero una posición rápida (caché); la alta precisión por GPS en interiores
// suele agotar el timeout y es lo que hacía fallar «Cerca».
export async function miPosicion(): Promise<Pos> {
  if (!('geolocation' in navigator)) throw new Error('Este navegador no permite ubicación.')
  if (!window.isSecureContext) throw new Error('La ubicación solo funciona con https.')

  try {
    return await pedir({ enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 })
  } catch {
    try {
      return await pedir({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 })
    } catch (e) {
      throw new Error(mensaje(e as GeolocationPositionError))
    }
  }
}
