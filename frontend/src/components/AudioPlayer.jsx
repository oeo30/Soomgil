import { useRef, useState, useEffect } from 'react'

export default function AudioPlayer({ mood }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [audioSrc, setAudioSrc] = useState('')

  useEffect(() => {
    if (mood) {
      // 무드에 따른 음악 파일 URL 생성
      const musicUrl = `http://localhost:5001/api/music/${encodeURIComponent(mood)}`
      setAudioSrc(musicUrl)
    }
  }, [mood])

  function toggle() {
    const a = audioRef.current
    if (!a) return
    if (playing) a.pause()
    else a.play()
  }

  if (!mood) {
    return null
  }

  return (
    <div>
      <audio
        ref={audioRef}
        src={audioSrc}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={(e) => console.error('음악 로드 실패:', e)}
      />
      <button style={styles.btn} onClick={toggle}>
        {playing ? '⏸️ 일시정지' : '▶️ 재생'}
      </button>
    </div>
  )
}

const styles = {
  btn: {
    padding: '10px 20px',
    borderRadius: 20,
    border: '2px solid #3a893e',
    background: '#3a893e',
    color: 'white',
    cursor: 'pointer',
    fontFamily: "MyCustomFont",
    fontSize: 16,
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  }
}

