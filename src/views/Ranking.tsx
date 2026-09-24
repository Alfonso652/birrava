import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { Profile } from '../types'
import { inicioDeMes } from '../lib/fecha'

interface Fila { user_id: string; username: string; cervezas: number; estilos: number; bares: number; checkins: number }
type Metrica = 'cervezas' | 'estilos' | 'bares'

const ETIQUETA: Record<Metrica, string> = { cervezas: 'Cervezas', estilos: 'Estilos', bares: 'Bares' }

export default function Ranking({ yo }: { yo: Profile }) {
  const [periodo, setPeriodo] = useState<'mes' | 'siempre'>('mes')
  const [metrica, setMetrica] = useState<Metrica>('cervezas')
  const [filas, setFilas] = useState<Fila[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    setCargando(true)
    const desde = periodo === 'mes' ? inicioDeMes().toISOString() : null
    supabase.rpc('ranking', { desde }).then(({ data }) => {
      setFilas((data ?? []) as Fila[])
      setCargando(false)
    })
  }, [periodo])

  const ordenadas = [...filas].sort((a, b) => b[metrica] - a[metrica])
  const medalla = (i: number) => ['🥇', '🥈', '🥉'][i] ?? `${i + 1}`

  return (
    <section>
      <h2>Ranking</h2>
      <p className="tenue pequeño">Cuenta la variedad: cada cerveza, estilo o bar suma una sola vez.</p>
      <div className="segmentado">
        <button className={periodo === 'mes' ? 'activo' : ''} onClick={() => setPeriodo('mes')}>Este mes</button>
        <button className={periodo === 'siempre' ? 'activo' : ''} onClick={() => setPeriodo('siempre')}>Siempre</button>
      </div>
      <div className="segmentado">
        {(Object.keys(ETIQUETA) as Metrica[]).map((m) => (
          <button key={m} className={metrica === m ? 'activo' : ''} onClick={() => setMetrica(m)}>{ETIQUETA[m]}</button>
        ))}
      </div>
      {cargando ? <p className="tenue">Cargando…</p> : ordenadas.length === 0 ? (
        <p className="tenue">Nadie ha puntuado todavía en este periodo.</p>
      ) : (
        <ol className="lista">
          {ordenadas.map((f, i) => (
            <li key={f.user_id}>
              <a href={`#/perfil/${f.user_id}`} className={`tarjeta fila-ranking ${f.user_id === yo.id ? 'yo' : ''}`}>
                <span className="puesto">{medalla(i)}</span>
                <span className="crece">@{f.username}</span>
                <b>{f[metrica]}</b>
              </a>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
