import { useState } from 'react'
import { fotoUrl, supabase } from '../supabase'
import type { Checkin, Profile } from '../types'
import { haceCuanto } from '../lib/fecha'
import Estrellas from './Estrellas'

interface Props {
  c: Checkin
  yo: Profile
  onBorrado?: (id: string) => void
}

export default function CheckinCard({ c, yo, onBorrado }: Props) {
  const [cheers, setCheers] = useState(c.cheers)
  const [ocupado, setOcupado] = useState(false)
  const lo = cheers.some((x) => x.user_id === yo.id)
  const mio = c.user_id === yo.id

  async function brindar() {
    if (ocupado || mio) return
    setOcupado(true)
    // Optimista: se revierte si falla.
    const antes = cheers
    setCheers(lo ? cheers.filter((x) => x.user_id !== yo.id) : [...cheers, { user_id: yo.id }])
    const { error } = lo
      ? await supabase.from('cheers').delete().eq('checkin_id', c.id).eq('user_id', yo.id)
      : await supabase.from('cheers').insert({ checkin_id: c.id })
    if (error) setCheers(antes)
    setOcupado(false)
  }

  async function borrar() {
    if (!confirm('¿Borrar este check-in?')) return
    const { error } = await supabase.from('checkins').delete().eq('id', c.id)
    if (error) return alert('No se pudo borrar')
    if (c.photo_path) await supabase.storage.from('fotos').remove([c.photo_path])
    onBorrado?.(c.id)
  }

  return (
    <article className="tarjeta checkin">
      <div className="checkin-cabecera">
        <a href={`#/perfil/${c.user_id}`} className="usuario">@{c.profiles?.username ?? '¿?'}</a>
        <span className="tenue">{haceCuanto(c.created_at)}</span>
      </div>
      <h3>{c.beer_name}</h3>
      <p className="tenue">
        {[c.brewery, c.style, c.abv != null ? `${c.abv}%` : null].filter(Boolean).join(' · ')}
      </p>
      <Estrellas valor={c.rating} />
      {c.bars && <p><a href={`#/bar/${c.bars.id}`}>📍 {c.bars.name}</a></p>}
      {c.note && <p className="nota">{c.note}</p>}
      {c.photo_path && <img className="foto" src={fotoUrl(c.photo_path)} alt={c.beer_name} loading="lazy" />}
      <div className="checkin-pie">
        <button className={`chinchin ${lo ? 'dado' : ''}`} onClick={brindar} disabled={mio}>
          🍻 {cheers.length > 0 ? cheers.length : ''} {mio ? '' : lo ? '¡Brindis!' : 'Brindis'}
        </button>
        {mio && <button className="enlace peligro" onClick={borrar}>Borrar</button>}
      </div>
    </article>
  )
}
