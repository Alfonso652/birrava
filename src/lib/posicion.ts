import { useCallback, useEffect, useRef, useState } from 'react'
import { miPosicion } from './geo'
import { baresCercaOsm, type BarOsm } from './osm'

type Pos = { lat: number; lng: number }

// La última posición se comparte entre pantallas para no pedir GPS en cada una.
let ultima: Pos | null = null

/** Posición del usuario + bares OSM alrededor. Se localiza sola si el permiso ya está concedido. */
export function useCercania() {
  const [pos, setPos] = useState<Pos | null>(ultima)
  const [osm, setOsm] = useState<BarOsm[]>([])
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState('')
  const enCurso = useRef(false)

  const localizar = useCallback(async () => {
    // Un doble toque lanzaría dos consultas a la vez y la que falle taparía a la buena.
    if (enCurso.current) return
    enCurso.current = true
    setError('')
    setBuscando(true)
    try {
      const p = await miPosicion()
      ultima = p
      setPos(p)
      setOsm(await baresCercaOsm(p))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      enCurso.current = false
      setBuscando(false)
    }
  }, [])

  useEffect(() => {
    // Sin permiso previo no se lanza: el aviso de ubicación debe salir por un toque del usuario.
    navigator.permissions?.query({ name: 'geolocation' })
      .then((r) => { if (r.state === 'granted') localizar() })
      .catch(() => {})
  }, [localizar])

  return { pos, osm, buscando, error, localizar }
}
