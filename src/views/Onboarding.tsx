import { useState, type FormEvent } from 'react'
import { supabase } from '../supabase'
import type { Profile } from '../types'

interface Props { uid: string; email: string; onListo: (p: Profile) => void }

export default function Onboarding({ uid, email, onListo }: Props) {
  const sugerido = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20)
  const [username, setUsername] = useState(sugerido.length >= 3 ? sugerido : '')
  const [error, setError] = useState('')

  async function guardar(e: FormEvent) {
    e.preventDefault()
    const u = username.trim().toLowerCase()
    if (!/^[a-z0-9_]{3,20}$/.test(u)) return setError('3–20 caracteres: letras minúsculas, números o _')
    const { data, error } = await supabase.from('profiles').insert({ id: uid, username: u }).select('id, username').single()
    if (error) return setError(error.code === '23505' ? 'Ese nombre ya está cogido' : error.message)
    onListo(data)
  }

  return (
    <main className="centro">
      <h1>¡Bienvenido!</h1>
      <form onSubmit={guardar} className="formulario">
        <label>Elige tu nombre de usuario
          <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} autoFocus />
        </label>
        <button className="primario">Empezar</button>
      </form>
      {error && <p className="error">{error}</p>}
      <button className="enlace" onClick={() => supabase.auth.signOut()}>Salir</button>
    </main>
  )
}
