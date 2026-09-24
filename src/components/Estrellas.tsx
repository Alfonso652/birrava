export default function Estrellas({ valor, onChange }: { valor: number; onChange?: (v: number) => void }) {
  return (
    <span className={`estrellas ${onChange ? 'editable' : ''}`} aria-label={`${valor} de 5`}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} estrellas`}>
            {n <= valor ? '★' : '☆'}
          </button>
        ) : (
          <span key={n}>{n <= valor ? '★' : '☆'}</span>
        ),
      )}
    </span>
  )
}
