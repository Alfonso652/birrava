import { useState } from 'react'
import { filtrarBares, fmtKm, useBares } from '../lib/bares'
import { miPosicion } from '../lib/geo'

export default function Bares() {
  const { bares, cargando } = useBares()
  const [texto, setTexto] = useState('')
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState('')

  async function cerca() {
    setError('')
    try { setPos(await miPosicion()) } catch (e) { setError((e as Error).message) }
  }

  const lista = filtrarBares(bares, texto, pos)
  return (
    <section>
      <h2>Bares</h2>
      <div className="fila">
        <input placeholder="Buscar bar o ciudad" value={texto} onChange={(e) => setTexto(e.target.value)} />
        <button className={pos ? 'primario' : 'secundario'} onClick={cerca}>📡 Cerca</button>
      </div>
      {error && <p className="error">{error}</p>}
      {cargando && <p className="tenue">Cargando…</p>}
      {!cargando && lista.length === 0 && (
        <p className="tenue">No hay bares todavía. Se crean al hacer un check-in.</p>
      )}
      <ul className="lista">
        {lista.map((b) => (
          <li key={b.id}>
            <a href={`#/bar/${b.id}`} className="tarjeta fila-bar">
              <div>
                <b>{b.name}</b>
                <div className="tenue">{[b.city, fmtKm(b.km)].filter(Boolean).join(' · ')}</div>
              </div>
              <span className="insignia">{b.checkins ?? 0} 🍺</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
