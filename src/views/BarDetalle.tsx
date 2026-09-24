import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { CHECKIN_SELECT, type Bar, type Checkin, type Profile } from '../types'
import CheckinCard from '../components/CheckinCard'

interface FilaRanking { user_id: string; username: string; cervezas: number; estilos: number; checkins: number }

export default function BarDetalle({ id, yo }: { id: string; yo: Profile }) {
  const [bar, setBar] = useState<Bar | null | undefined>(undefined)
  const [ranking, setRanking] = useState<FilaRanking[]>([])
  const [recientes, setRecientes] = useState<Checkin[]>([])

  useEffect(() => {
    supabase.from('bars').select('id, name, city, lat, lng').eq('id', id).maybeSingle()
      .then(({ data }) => setBar(data as Bar | null))
    supabase.rpc('ranking_bar', { bar: id }).then(({ data }) => setRanking((data ?? []) as FilaRanking[]))
    supabase.from('checkins').select(CHECKIN_SELECT).eq('bar_id', id)
      .order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => setRecientes((data ?? []) as Checkin[]))
  }, [id])

  if (bar === undefined) return <p className="tenue">Cargando…</p>
  if (bar === null) return <p>Bar no encontrado. <a href="#/bares">Volver</a></p>

  const rey = ranking[0]
  const mapa = bar.lat != null && bar.lng != null
    ? `https://www.openstreetmap.org/?mlat=${bar.lat}&mlon=${bar.lng}#map=18/${bar.lat}/${bar.lng}`
    : null

  return (
    <section>
      <h2>📍 {bar.name}</h2>
      <p className="tenue">
        {bar.city}{mapa && <> · <a href={mapa} target="_blank" rel="noreferrer">Ver en mapa</a></>}
      </p>

      {rey && (
        <div className="tarjeta rey">
          <span className="corona">👑</span>
          <div>
            <div className="tenue">Rey del bar</div>
            <a href={`#/perfil/${rey.user_id}`}><b>@{rey.username}</b></a>
            <div className="tenue">{rey.cervezas} cervezas distintas · {rey.estilos} estilos</div>
          </div>
        </div>
      )}

      {ranking.length > 1 && (
        <table className="tabla tarjeta">
          <thead><tr><th>#</th><th>Usuario</th><th>Cervezas</th><th>Estilos</th></tr></thead>
          <tbody>
            {ranking.map((r, i) => (
              <tr key={r.user_id} className={r.user_id === yo.id ? 'yo' : ''}>
                <td>{i + 1}</td>
                <td><a href={`#/perfil/${r.user_id}`}>@{r.username}</a></td>
                <td>{r.cervezas}</td>
                <td>{r.estilos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Últimos check-ins</h3>
      {recientes.length === 0 && <p className="tenue">Nadie ha hecho check-in aquí aún. ¡Sé el primero!</p>}
      {recientes.map((c) => (
        <CheckinCard key={c.id} c={c} yo={yo} onBorrado={(x) => setRecientes((xs) => xs.filter((y) => y.id !== x))} />
      ))}
    </section>
  )
}
