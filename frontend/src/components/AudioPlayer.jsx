import { useRef, useState } from "react";

export default function AudioPlayer({ src }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const togglePlay = () => {
    // src가 없으면 클릭해도 동작 안 함
    if (!src) return;

    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  return (
    <div style={{ marginTop: 10 }}>
      {src && (
        <audio
          ref={audioRef}
          src={src}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      )}
      <button
        onClick={togglePlay}
        style={{
          padding: "12px 16px",
          border: "none",
          borderRadius: 8,
          background: src ? "#4f46e5" : "#aaa", // 파일 없으면 회색 버튼
          color: "#fff",
          cursor: src ? "pointer" : "not-allowed",
        }}
      >
        {src ? (playing ? "⏸️ 일시정지" : "▶️ 재생") : "재생 불가"}
      </button>
    </div>
  );
}


