import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { CHECKIN_SELECT, type Checkin, type Profile } from '../types'
import CheckinCard from '../components/CheckinCard'

const PAGINA = 20

export default function Feed({ yo }: { yo: Profile }) {
  const [items, setItems] = useState<Checkin[]>([])
  const [hayMas, setHayMas] = useState(true)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const cargar = useCallback(async (desde: number) => {
    setCargando(true)
    const { data, error } = await supabase.from('checkins').select(CHECKIN_SELECT)
      .order('created_at', { ascending: false }).range(desde, desde + PAGINA - 1)
    setCargando(false)
    if (error) return setError('No se pudo cargar el feed')
    setItems((prev) => (desde === 0 ? data : [...prev, ...data]) as Checkin[])
    setHayMas(data.length === PAGINA)
  }, [])

  useEffect(() => { cargar(0) }, [cargar])

  return (
    <section>
      {error && <p className="error">{error}</p>}
      {!cargando && items.length === 0 && !error && (
        <div className="tarjeta centro">
          <p>Aún no hay check-ins.</p>
          <a className="boton primario" href="#/nuevo">Registra tu primera cerveza</a>
        </div>
      )}
      {items.map((c) => (
        <CheckinCard key={c.id} c={c} yo={yo} onBorrado={(id) => setItems((xs) => xs.filter((x) => x.id !== id))} />
      ))}
      {hayMas && items.length > 0 && (
        <button className="secundario ancho" disabled={cargando} onClick={() => cargar(items.length)}>
          {cargando ? 'Cargando…' : 'Ver más'}
        </button>
      )}
    </section>
  )
}
