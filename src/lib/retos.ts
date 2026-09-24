import type { Checkin } from '../types'

type Mini = Pick<Checkin, 'beer_name' | 'brewery' | 'style' | 'bar_id' | 'note'>

export interface Reto {
  id: string
  titulo: string
  descripcion: string
  meta: number
  progreso: (cs: Mini[]) => number
}

const clave = (c: Mini) => `${c.beer_name.toLowerCase()}|${(c.brewery ?? '').toLowerCase()}`
const distintos = <T>(xs: T[]) => new Set(xs).size

// Retos mensuales: premian descubrir cosas nuevas, nunca beber más.
export const RETOS: Reto[] = [
  { id: 'cata', titulo: 'Catador', descripcion: '10 cervezas distintas este mes', meta: 10,
    progreso: (cs) => distintos(cs.map(clave)) },
  { id: 'estilos', titulo: 'Explorador', descripcion: '5 estilos distintos este mes', meta: 5,
    progreso: (cs) => distintos(cs.map((c) => c.style.toLowerCase())) },
  { id: 'bares', titulo: 'Ruta de bares', descripcion: '3 bares distintos este mes', meta: 3,
    progreso: (cs) => distintos(cs.filter((c) => c.bar_id).map((c) => c.bar_id)) },
  { id: 'ipas', titulo: 'Lupulado', descripcion: '5 IPAs distintas este mes', meta: 5,
    progreso: (cs) => distintos(cs.filter((c) => /ipa/i.test(c.style)).map(clave)) },
  { id: 'critico', titulo: 'Crítico', descripcion: 'Escribe 5 notas de cata', meta: 5,
    progreso: (cs) => cs.filter((c) => (c.note ?? '').trim().length >= 20).length },
]

export const INSIGNIAS_ESTILOS = [
  { n: 5, nombre: 'Curioso' },
  { n: 10, nombre: 'Viajero' },
  { n: 20, nombre: 'Enciclopedia' },
  { n: 30, nombre: 'Maestro cervecero' },
]
