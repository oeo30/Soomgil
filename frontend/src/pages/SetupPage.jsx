import { useNavigate } from 'react-router-dom'
import ToggleAccordion from '../components/ToggleAccordion.jsx'
import OptionPicker from '../components/OptionPicker.jsx'
import { useSelection } from '../context/SelectionContext.jsx'

export default function SetupPage() {
  const nav = useNavigate()
  const { season, setSeason, length, setLength, structure, setStructure, canProceed } = useSelection()

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>맞춤 산책 경로 설정</h1>

      <ToggleAccordion label={`1) 계절 선택 ${season ? `: ${season}` : ''}`}>
        <OptionPicker options={['봄', '여름', '가을', '겨울']} value={season} onChange={setSeason} />
      </ToggleAccordion>

      <ToggleAccordion label={`2) 코스 길이 ${length ? `: ${length}` : ''}`}>
        <OptionPicker options={['3km', '5km', '7km']} value={length} onChange={setLength} />
      </ToggleAccordion>

      <ToggleAccordion label={`3) 구조(지형/환경) ${structure ? `: ${structure}` : ''}`}>
        <OptionPicker options={['산', '하천', '도로']} value={structure} onChange={setStructure} />
      </ToggleAccordion>

      <button
        style={{ ...styles.nextBtn, opacity: canProceed ? 1 : 0.5, cursor: canProceed ? 'pointer' : 'not-allowed' }}
        disabled={!canProceed}
        onClick={() => nav('/result')}
      >
        다음으로
      </button>
    </div>
  )
}

const styles = {
  page: { maxWidth: 560, margin: '40px auto', padding: 20 },
  title: { marginBottom: 20 },
  nextBtn: {
    width: '100%', marginTop: 12, padding: '14px 12px',
    fontSize: 16, borderRadius: 10, border: 'none', background: '#4f46e5', color: '#fff'
  }
}
