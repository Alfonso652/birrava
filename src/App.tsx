import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { configurado, supabase } from './supabase'
import type { Profile, Ruta } from './types'
import Login from './views/Login'
import Onboarding from './views/Onboarding'
import Feed from './views/Feed'
import NuevoCheckin from './views/NuevoCheckin'
import Bares from './views/Bares'
import BarDetalle from './views/BarDetalle'
import Ranking from './views/Ranking'
import Perfil from './views/Perfil'

// Hash routing: GitHub Pages no reescribe rutas, así que /bar/123 daría 404 al recargar.
function leerRuta(): Ruta {
  const [v, id] = location.hash.replace(/^#\/?/, '').split('/')
  switch (v) {
    case 'nuevo': return { v: 'nuevo' }
    case 'bares': return { v: 'bares' }
    case 'bar': return id ? { v: 'bar', id } : { v: 'bares' }
    case 'ranking': return { v: 'ranking' }
    case 'perfil': return { v: 'perfil', id }
    default: return { v: 'feed' }
  }
}

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [perfil, setPerfil] = useState<Profile | null | undefined>(undefined)
  const [ruta, setRuta] = useState<Ruta>(leerRuta)

  useEffect(() => {
    const onHash = () => { setRuta(leerRuta()); window.scrollTo(0, 0) }
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (!configurado) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const uid = session?.user.id
  useEffect(() => {
    if (!uid) { setPerfil(undefined); return }
    supabase.from('profiles').select('id, username').eq('id', uid).maybeSingle()
      .then(({ data }) => setPerfil(data))
  }, [uid])

  if (!configurado) {
    return (
      <main className="centro">
        <h1>🍺 Birrava</h1>
        <p>Falta configurar Supabase. Copia <code>.env.example</code> a <code>.env</code> y rellena las claves.</p>
      </main>
    )
  }
  if (session === undefined || (session && perfil === undefined)) return <main className="centro"><p>Cargando…</p></main>
  if (!session) return <Login />
  if (!perfil) return <Onboarding uid={session.user.id} email={session.user.email ?? ''} onListo={setPerfil} />

  const vista = (() => {
    switch (ruta.v) {
      case 'nuevo': return <NuevoCheckin yo={perfil} />
      case 'bares': return <Bares />
      case 'bar': return <BarDetalle id={ruta.id} yo={perfil} />
      case 'ranking': return <Ranking yo={perfil} />
      case 'perfil': return <Perfil id={ruta.id ?? perfil.id} yo={perfil} />
      default: return <Feed yo={perfil} />
    }
  })()

  const activo = (v: Ruta['v'][]) => (v.includes(ruta.v) ? 'activo' : '')
  const enMiPerfil = ruta.v === 'perfil' && (!ruta.id || ruta.id === perfil.id)

  return (
    <>
      <header className="cabecera">
        <a href="#/" className="logo">🍺 Birrava</a>
      </header>
      <main className="contenido">{vista}</main>
      <nav className="tabbar">
        <a href="#/" className={activo(['feed'])}><span>🏠</span>Feed</a>
        <a href="#/bares" className={activo(['bares', 'bar'])}><span>📍</span>Bares</a>
        <a href="#/nuevo" className="boton-nuevo" aria-label="Nuevo check-in">＋</a>
        <a href="#/ranking" className={activo(['ranking'])}><span>🏆</span>Ranking</a>
        <a href="#/perfil" className={enMiPerfil ? 'activo' : ''}><span>👤</span>Yo</a>
      </nav>
    </>
  )
}
