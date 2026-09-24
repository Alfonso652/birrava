import { useState } from 'react'
import { supabase } from '../supabase'
import type { Bar } from '../types'
import { filtrarBares, fmtKm, guardarBarOsm, useBares, type BarLista } from '../lib/bares'
import { miPosicion } from '../lib/geo'
import { useCercania } from '../lib/posicion'
import type { BarOsm } from '../lib/osm'

interface Props { valor: Bar | null; onChange: (b: Bar | null) => void }

export default function SelectorBar({ valor, onChange }: Props) {
  const { bares, setBares } = useBares()
  const { pos, osm, buscando, error: errorPos, localizar } = useCercania()
  const [texto, setTexto] = useState('')
  const [creando, setCreando] = useState(false)
  const [ciudad, setCiudad] = useState('')
  const [error, setError] = useState('')

  async function elegir(b: BarLista) {
    setError('')
    if (b.id) return onChange(b)
    try {
      const guardado = await guardarBarOsm(b as BarOsm)
      setBares([{ ...guardado, checkins: 0 }, ...bares])
      onChange(guardado)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function crear() {
    setError('')
    const name = texto.trim()
    if (name.length < 2) return setError('Pon el nombre del bar')
    // Se guarda la ubicación actual: se asume que el bar se crea estando en él.
    let p = pos
    if (!p) { try { p = await miPosicion() } catch { p = null } }
    const { data, error } = await supabase.from('bars')
      .insert({ name, city: ciudad.trim() || null, lat: p?.lat ?? null, lng: p?.lng ?? null })
      .select('id, name, city, lat, lng').single()
    if (error) return setError('No se pudo crear el bar')
    const nuevo = { ...(data as Bar), checkins: 0 }
    setBares([nuevo, ...bares])
    onChange(nuevo)
    setCreando(false)
  }

  if (valor) {
    return (
      <div className="bar-elegido">
        <span>📍 {valor.name}{valor.city ? `, ${valor.city}` : ''}</span>
        <button type="button" className="enlace" onClick={() => onChange(null)}>Cambiar</button>
      </div>
    )
  }

  const lista = filtrarBares(bares, texto, pos, osm).slice(0, 8)
  return (
    <div className="selector-bar">
      <div className="fila">
        <input type="search" placeholder="Busca o escribe un bar nuevo" value={texto} onChange={(e) => setTexto(e.target.value)} />
        <button type="button" className={pos ? 'primario' : 'secundario'} onClick={localizar} disabled={buscando} title="Bares cerca de mí">
          {buscando ? '…' : '📡'}
        </button>
      </div>
      {!creando && (
        <ul className="lista-opciones">
          {lista.map((b) => (
            <li key={b.id ?? b.osm_id}>
              <button type="button" onClick={() => elegir(b)}>
                {b.name}{b.city ? <span className="tenue">, {b.city}</span> : null}
                {b.km != null && <span className="tenue"> · {fmtKm(b.km)}</span>}
              </button>
            </li>
          ))}
          {texto.trim().length >= 2 && (
            <li><button type="button" className="enlace" onClick={() => setCreando(true)}>＋ Crear «{texto.trim()}»</button></li>
          )}
        </ul>
      )}
      {creando && (
        <div className="fila">
          <input placeholder="Ciudad (opcional)" value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
          <button type="button" className="primario" onClick={crear}>Crear</button>
          <button type="button" className="enlace" onClick={() => setCreando(false)}>✕</button>
        </div>
      )}
      {(error || errorPos) && <p className="error">{error || errorPos}</p>}
    </div>
  )
}
