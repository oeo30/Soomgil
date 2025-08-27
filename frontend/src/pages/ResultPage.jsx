import { useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelection } from "../context/SelectionContext.jsx";
import RouteMap from "../components/RouteMap.jsx";
import AudioPlayer from "../components/AudioPlayer.jsx";
import { buildMockRoute } from "../utils/mockRoute.js";

export default function ResultPage() {
  const nav = useNavigate();
  const { startLocation, duration, canProceed, address } = useSelection();

  // 만약 조건이 안 채워졌는데 바로 /result로 들어온 경우 → 홈으로 돌려보내기
  useEffect(() => {
    if (!canProceed) nav("/", { replace: true });
  }, [canProceed, nav]);

  // 목업 경로 생성 (시작 위치 + 소요시간 기반)
  const pathLatLngs = useMemo(() => {
    return buildMockRoute({ startLocation, duration });
  }, [startLocation, duration]);

  // 설명 문구
const description = `출발지: ${address|| "미지정"
}
소요 시간: ${duration ?? "미지정"}분
완만한 보행로와 휴식 포인트를 고려해 추천된 산책 경로입니다.`;


  return (
    <div style={styles.page}>
      <h1 style={styles.title}>추천 산책 경로</h1>

      {/* 지도 */}
      <RouteMap pathLatLngs={pathLatLngs} />

      {/* 경로 설명 */}
      <div style={{ marginTop: 20 }}>
        <h2 style={styles.subtitle}>경로 설명</h2>
        <p style={styles.text}>{description}</p>
      </div>

      {/* 음악 추천 */}
      <div style={{ marginTop: 20 }}>
        <h2 style={styles.subtitle}>추천 음악 🎵</h2>
        <AudioPlayer src="/sample.mp3" />
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 720, margin: "32px auto", padding: 20 },
  title: { fontSize: 50, color: "black", marginBottom: 16, textAlign: "center",fontFamily: "MyCustomFont",textShadow: "0.8px 0 black, 0.8px 0 black, 0 0.8px black, 0 -0.8px black", },
  subtitle: { fontSize: 35, color: "black", marginBottom: 8,fontFamily: "MyCustomFont",textShadow: "0.5px 0 black, -0.5px 0 black, 0 0.5px black, 0 -0.5px black", },
  text: { fontSize: 20, whiteSpace: "pre-line", lineHeight: 1.6, fontFamily: "MyCustomFont", },
};



