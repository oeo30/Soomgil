import { useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelection } from '../context/SelectionContext.jsx'
import RouteMap from '../components/RouteMap.jsx'
import AudioPlayer from '../components/AudioPlayer.jsx'
import { buildMockPath } from '../utils/mockRoute.js'

export default function ResultPage() {
  const nav = useNavigate()
  const { season, length, structure, canProceed } = useSelection()

  // 잘못된 진입 방지
  useEffect(() => {
    if (!canProceed) nav('/', { replace: true })
  }, [canProceed, nav])

  const pathLatLngs = useMemo(
    () => buildMockPath({ season, length, structure }),
    [season, length, structure]
  )

  const description = `선택한 조건(${season ?? '-'} · ${length ?? '-'} · ${structure ?? '-'})에 맞춘 추천 경로입니다.
완만한 구간과 휴식 포인트를 고려했어요. 안전한 보행 환경 중심으로 안내합니다.`

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>맞춤 경로</h2>

      <RouteMap pathLatLngs={pathLatLngs} />

      <div style={{ marginTop: 20 }}>
        <h3>1. 경로 설명</h3>
        <p style={styles.desc}>{description}</p>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3>2. 생성된 노래</h3>
        {/* public 폴더에 sample.mp3를 두면 /sample.mp3 로 접근 가능 */}
        <AudioPlayer src="/sample.mp3" />
      </div>
    </div>
  )
}

const styles = {
  page: { maxWidth: 720, margin: '32px auto', padding: 20 },
  title: { marginBottom: 12 },
  desc: { lineHeight: 1.6, whiteSpace: 'pre-line' }
}
