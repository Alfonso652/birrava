import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { CHECKIN_SELECT, type Checkin, type Profile } from '../types'
import { INSIGNIAS_ESTILOS, RETOS } from '../lib/retos'
import { inicioDeMes } from '../lib/fecha'
import CheckinCard from '../components/CheckinCard'

type Mini = Pick<Checkin, 'beer_name' | 'brewery' | 'style' | 'bar_id' | 'note' | 'created_at'>

export default function Perfil({ id, yo }: { id: string; yo: Profile }) {
  const [perfil, setPerfil] = useState<Profile | null | undefined>(undefined)
  const [todos, setTodos] = useState<Mini[]>([])
  const [recientes, setRecientes] = useState<Checkin[]>([])
  const soyYo = id === yo.id

  useEffect(() => {
    setPerfil(undefined)
    supabase.from('profiles').select('id, username').eq('id', id).maybeSingle().then(({ data }) => setPerfil(data))
    // Solo columnas ligeras para estadísticas; el tope evita traer un histórico ilimitado.
    supabase.from('checkins').select('beer_name, brewery, style, bar_id, note, created_at')
      .eq('user_id', id).order('created_at', { ascending: false }).limit(5000)
      .then(({ data }) => setTodos((data ?? []) as Mini[]))
    supabase.from('checkins').select(CHECKIN_SELECT).eq('user_id', id)
      .order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => setRecientes((data ?? []) as Checkin[]))
  }, [id])

  if (perfil === undefined) return <p className="tenue">Cargando…</p>
  if (perfil === null) return <p>Usuario no encontrado.</p>

  const clave = (c: Mini) => `${c.beer_name.toLowerCase()}|${(c.brewery ?? '').toLowerCase()}`
  const cervezas = new Set(todos.map(clave)).size
  const porEstilo = new Map<string, number>()
  for (const c of todos) porEstilo.set(c.style, (porEstilo.get(c.style) ?? 0) + 1)
  const estilos = new Set(todos.map((c) => c.style.toLowerCase())).size
  const bares = new Set(todos.filter((c) => c.bar_id).map((c) => c.bar_id)).size
  const topEstilos = [...porEstilo.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)

  const mes = inicioDeMes().getTime()
  const delMes = todos.filter((c) => new Date(c.created_at).getTime() >= mes)

  return (
    <section>
      <div className="perfil-cabecera">
        <h2>@{perfil.username}</h2>
        {soyYo && <button className="enlace" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>}
      </div>

      <div className="stats">
        <div className="tarjeta"><b>{todos.length}</b><span>check-ins</span></div>
        <div className="tarjeta"><b>{cervezas}</b><span>cervezas</span></div>
        <div className="tarjeta"><b>{estilos}</b><span>estilos</span></div>
        <div className="tarjeta"><b>{bares}</b><span>bares</span></div>
      </div>

      <h3>Insignias</h3>
      <div className="insignias">
        {INSIGNIAS_ESTILOS.map((b) => (
          <span key={b.n} className={`insignia ${estilos >= b.n ? 'lograda' : ''}`} title={`${b.n} estilos distintos`}>
            {estilos >= b.n ? '🏅' : '🔒'} {b.nombre} <small>({b.n} estilos)</small>
          </span>
        ))}
      </div>

      <h3>Retos del mes</h3>
      {RETOS.map((r) => {
        const p = Math.min(r.progreso(delMes), r.meta)
        return (
          <div key={r.id} className="tarjeta reto">
            <div className="fila-reto">
              <b>{p >= r.meta ? '✅' : '🎯'} {r.titulo}</b>
              <span className="tenue">{p}/{r.meta}</span>
            </div>
            <div className="tenue pequeño">{r.descripcion}</div>
            <div className="barra"><div style={{ width: `${(p / r.meta) * 100}%` }} /></div>
          </div>
        )
      })}

      {topEstilos.length > 0 && (
        <>
          <h3>Estilos favoritos</h3>
          <ul className="lista">
            {topEstilos.map(([s, n]) => (
              <li key={s} className="fila-reto"><span>{s}</span><span className="tenue">{n}</span></li>
            ))}
          </ul>
        </>
      )}

      <h3>Últimos check-ins</h3>
      {recientes.length === 0 && <p className="tenue">Sin check-ins todavía.</p>}
      {recientes.map((c) => (
        <CheckinCard key={c.id} c={c} yo={yo} onBorrado={(x) => setRecientes((xs) => xs.filter((y) => y.id !== x))} />
      ))}
    </section>
  )
}
