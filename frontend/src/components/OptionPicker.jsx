export default function OptionPicker({ options, value, onChange }) {
  return (
    <div style={styles.wrap}>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{ ...styles.chip, ...(value === opt ? styles.active : {}) }}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

const styles = {
  wrap: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  chip: {
    padding: '10px 14px', borderRadius: 999,
    border: '1px solid #ccc', background: '#fff', cursor: 'pointer'
  },
  active: { borderColor: '#4f46e5', boxShadow: '0 0 0 2px rgba(79,70,229,0.2)' }
}
