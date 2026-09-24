const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

export function haceCuanto(iso: string) {
  const seg = (new Date(iso).getTime() - Date.now()) / 1000
  const tramos: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60],
  ]
  for (const [unidad, s] of tramos) if (Math.abs(seg) >= s) return rtf.format(Math.round(seg / s), unidad)
  return 'ahora'
}

export function inicioDeMes() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
