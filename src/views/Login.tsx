import { useState, type FormEvent } from 'react'
import { supabase } from '../supabase'

// Código por email en vez de magic link: en iOS el enlace abre Safari y no la PWA instalada,
// así que la sesión acabaría en el navegador equivocado.
export default function Login() {
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function pedirCodigo(e: FormEvent) {
    e.preventDefault()
    setError(''); setCargando(true)
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } })
    setCargando(false)
    if (error) return setError(error.message.includes('rate') ? 'Demasiados intentos. Espera unos minutos.' : error.message)
    setEnviado(true)
  }

  async function verificar(e: FormEvent) {
    e.preventDefault()
    setError(''); setCargando(true)
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: codigo.trim(), type: 'email' })
    setCargando(false)
    if (error) setError('Código incorrecto o caducado')
  }

  return (
    <main className="centro login">
      <h1>🍺 Birrava</h1>
      <p className="tenue">El Strava de las cervezas. Descubre, puntúa y pica a tu cuadrilla.</p>
      {!enviado ? (
        <form onSubmit={pedirCodigo} className="formulario">
          <label>Email
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button className="primario" disabled={cargando}>{cargando ? 'Enviando…' : 'Envíame un código'}</button>
        </form>
      ) : (
        <form onSubmit={verificar} className="formulario">
          <p>Te hemos enviado un código a <b>{email}</b>.</p>
          <label>Código
            <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" required
              value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          </label>
          <button className="primario" disabled={cargando}>{cargando ? 'Comprobando…' : 'Entrar'}</button>
          <button type="button" className="enlace" onClick={() => { setEnviado(false); setCodigo('') }}>Cambiar email</button>
        </form>
      )}
      {error && <p className="error">{error}</p>}
      <p className="tenue pequeño">Bebe con moderación. Aquí gana quien descubre más, no quien bebe más.</p>
    </main>
  )
}
