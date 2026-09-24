import { useState } from 'react'
import { filtrarBares, fmtKm, guardarBarOsm, useBares, type BarLista } from '../lib/bares'
import { useCercania } from '../lib/posicion'
import type { BarOsm } from '../lib/osm'
import { ir } from '../lib/nav'
import MapaBares from '../components/MapaBares'

export default function Bares() {
  const { bares, cargando } = useBares()
  const { pos, osm, buscando, error, localizar } = useCercania()
  const [texto, setTexto] = useState('')
  const [abriendo, setAbriendo] = useState(false)
  const [errorAbrir, setErrorAbrir] = useState('')

  async function abrir(b: BarLista) {
    if (b.id) return ir(`#/bar/${b.id}`)
    setErrorAbrir('')
    setAbriendo(true)
    try {
      const guardado = await guardarBarOsm(b as BarOsm)
      ir(`#/bar/${guardado.id}`)
    } catch (e) {
      setErrorAbrir((e as Error).message)
      setAbriendo(false)
    }
  }

  const lista = filtrarBares(bares, texto, pos, osm)
  // Con ubicación, la lista se centra en lo cercano; los bares lejanos siguen saliendo al buscar.
  const visibles = pos && !texto ? lista.filter((b) => b.km == null || b.km <= 3).slice(0, 60) : lista.slice(0, 100)

  return (
    <section>
      <h2>Bares</h2>
      <div className="fila">
        <input type="search" placeholder="Buscar bar o ciudad" value={texto} onChange={(e) => setTexto(e.target.value)} />
        <button className={pos ? 'primario' : 'secundario'} onClick={localizar} disabled={buscando}>
          {buscando ? '…' : '📡 Cerca'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {errorAbrir && <p className="error">{errorAbrir}</p>}

      {pos ? (
        <>
          <MapaBares pos={pos} bares={visibles} onElegir={abrir} />
          <p className="tenue pequeño leyenda">
            <span className="punto ambar" /> con check-ins en Birrava · <span className="punto gris" /> otros bares (OpenStreetMap)
          </p>
        </>
      ) : (
        !buscando && <p className="tenue pequeño">Pulsa <b>📡 Cerca</b> para ver el mapa con los bares de alrededor.</p>
      )}

      {(cargando || buscando) && <p className="tenue">Buscando bares…</p>}
      {!cargando && !buscando && visibles.length === 0 && (
        <p className="tenue">{pos ? 'No hay bares registrados cerca.' : 'No hay bares todavía.'}</p>
      )}
      <ul className="lista">
        {visibles.map((b) => (
          <li key={b.id ?? b.osm_id}>
            <button className="tarjeta fila-bar ancho texto-izq" onClick={() => abrir(b)} disabled={abriendo}>
              <div>
                <b>{b.name}</b>
                <div className="tenue">{[b.city, fmtKm(b.km)].filter(Boolean).join(' · ')}</div>
              </div>
              {b.id ? <span className="insignia">{b.checkins ?? 0} 🍺</span> : <span className="insignia tenue">nuevo</span>}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
