import { useState } from 'react'

export default function ToggleAccordion({ label, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={styles.box}>
      <button style={styles.button} onClick={() => setOpen(o => !o)}>
        {label} {open ? '▲' : '▼'}
      </button>
      {open && <div style={styles.panel}>{children}</div>}
    </div>
  )
}

const styles = {
  box: { marginBottom: 12 },
  button: {
    width: '100%', padding: '14px 12px', fontSize: 16,
    borderRadius: 10, border: '1px solid #ddd', background: '#fff', cursor: 'pointer'
  },
  panel: {
    marginTop: 8, padding: 12, border: '1px solid #eee', borderRadius: 8, background: '#fafafa'
  }
}
