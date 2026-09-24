import { useState, type FormEvent } from 'react'
import { supabase } from '../supabase'
import type { Bar, Profile } from '../types'
import { ESTILOS } from '../lib/estilos'
import { comprimir } from '../lib/imagen'
import { ir } from '../lib/nav'
import Estrellas from '../components/Estrellas'
import SelectorBar from '../components/SelectorBar'

export default function NuevoCheckin({ yo }: { yo: Profile }) {
  const [beer, setBeer] = useState('')
  const [brewery, setBrewery] = useState('')
  const [style, setStyle] = useState('')
  const [abv, setAbv] = useState('')
  const [rating, setRating] = useState(0)
  const [note, setNote] = useState('')
  const [bar, setBar] = useState<Bar | null>(null)
  const [foto, setFoto] = useState<File | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!rating) return setError('Puntúa la cerveza')
    setGuardando(true)
    try {
      let photo_path: string | null = null
      if (foto) {
        const blob = await comprimir(foto)
        photo_path = `${yo.id}/${crypto.randomUUID()}.jpg`
        const { error } = await supabase.storage.from('fotos').upload(photo_path, blob, { contentType: 'image/jpeg' })
        if (error) throw new Error('No se pudo subir la foto')
      }
      const { error } = await supabase.from('checkins').insert({
        beer_name: beer.trim(),
        brewery: brewery.trim() || null,
        style: style.trim(),
        abv: abv ? Number(abv.replace(',', '.')) : null,
        rating,
        note: note.trim() || null,
        bar_id: bar?.id ?? null,
        photo_path,
      })
      if (error) {
        // Evita dejar fotos huérfanas ocupando la cuota gratuita.
        if (photo_path) await supabase.storage.from('fotos').remove([photo_path])
        throw new Error('No se pudo guardar el check-in')
      }
      ir('#/')
    } catch (err) {
      setError((err as Error).message)
      setGuardando(false)
    }
  }

  return (
    <section>
      <h2>Nuevo check-in</h2>
      <form onSubmit={guardar} className="formulario tarjeta">
        <label>Cerveza *
          <input required maxLength={80} value={beer} onChange={(e) => setBeer(e.target.value)} placeholder="Nombre" />
        </label>
        <label>Cervecera
          <input maxLength={80} value={brewery} onChange={(e) => setBrewery(e.target.value)} placeholder="Quién la hace" />
        </label>
        <div className="fila">
          <label className="crece">Estilo *
            <input required list="estilos" maxLength={40} value={style} onChange={(e) => setStyle(e.target.value)} />
            <datalist id="estilos">{ESTILOS.map((s) => <option key={s} value={s} />)}</datalist>
          </label>
          <label className="estrecho">% alc.
            <input inputMode="decimal" pattern="[0-9]{1,2}([.,][0-9])?" value={abv} onChange={(e) => setAbv(e.target.value)} />
          </label>
        </div>
        <div>
          <span className="etiqueta">Puntuación *</span>
          <Estrellas valor={rating} onChange={setRating} />
        </div>
        <div>
          <span className="etiqueta">Bar</span>
          <SelectorBar valor={bar} onChange={setBar} />
        </div>
        <label>Nota de cata
          <textarea maxLength={500} rows={3} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Aroma, sabor, con quién…" />
        </label>
        <label>Foto
          <input type="file" accept="image/*" capture="environment" onChange={(e) => setFoto(e.target.files?.[0] ?? null)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primario" disabled={guardando}>{guardando ? 'Guardando…' : '🍺 Registrar'}</button>
      </form>
    </section>
  )
}
