import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelection } from "../context/SelectionContext.jsx";
import RouteMap from "../components/RouteMap.jsx";
import AudioPlayer from "../components/AudioPlayer.jsx";
import { buildMockRoute } from "../utils/mockRoute.js";

export default function ResultPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { result, startLocation, duration, mood, address } = location.state || {};
  const { canProceed } = useSelection();

  // 잘못 들어온 경우 SetupPage로 리다이렉트
  if (!canProceed || !result) {
    nav("/", { replace: true });
    return null;
  }

  // 경로 설명
  const descriptionList = Array.isArray(result.description)
    ? result.description
    : [
        {
          path_name: "추천 경로",
          description: "완만한 보행로와 휴식 포인트를 고려해 추천된 산책 경로입니다.",
        },
      ];

  // 경로 좌표 추출
  const pathLatLngs = useMemo(() => {
    if (result?.geojson?.features?.[0]?.geometry?.coordinates) {
      return result.geojson.features[0].geometry.coordinates;
    }
    return buildMockRoute({ startLocation, duration });
  }, [result, startLocation, duration]);

  return (
    <div style={styles.page}>
      <div style={styles.backBtn}>
        <button
  onClick={() => nav("/")}
  style={{
    padding: "4px 8px",
    background: "#dadadaff", // 원하는 색상 (hex, rgb, hsl 다 가능)
    color: "black",
  }}
>
  <span style={{ marginRight: "8px" }}>←</span>
</button>

      </div>
      <div>
        <h1 style={styles.title}>추천 산책 경로</h1>

        {/* 지도 */}
        <RouteMap geojsonData={result?.geojson} startLocation={startLocation} />

        {/* 경로 설명 */}
        <div style={{ marginTop: 20 }}>
          <h2 style={styles.subtitle}>🗺️ 경로 설명</h2>
          <p style={styles.text}>
            출발지: {address || "미지정"} <br />
            소요 시간: {duration ?? "미지정"}분 <br />
          </p>

          {descriptionList.map((item, index) => (
            <div key={index} style={{ marginBottom: 20 }}>
              <strong style={styles.pathName}>{item.path_name}</strong>
              <p style={styles.text}>{item.description}</p>
            </div>
          ))}
        </div>

        {/* 음악 추천 */}
        <div style={{ marginTop: 20 }}>
          <h2 style={styles.subtitle}>🎵 추천 음악</h2>
          <div style={{ marginTop: 20, marginBottom: 40 }}>
            <AudioPlayer mood={mood} />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { 
    maxWidth: 720, 
    margin: "32px auto", 
    padding: 20,
    paddingBottom: 80
  },
  backBtn: {
    fontSize: 13
  },
  title: {
    fontSize: 50,
    color: "black",
    marginBottom: 16,
    textAlign: "center",
    fontFamily: "MyCustomFont",
    textShadow: "0.8px 0 black, 0.8px 0 black, 0 0.8px black, 0 -0.8px black",
  },
  subtitle: {
    fontSize: 40,
    color: "black",
    marginBottom: 8,
    fontFamily: "MyCustomFont",
    textShadow: "0.5px 0 black, -0.5px 0 black, 0 0.5px black, 0 -0.5px black",
  },
  pathName: {
    fontSize: 25,
    color: "black",
    marginBottom: 8,
    fontFamily: "MyCustomFont",
    textShadow: "0.5px 0 black, -0.5px 0 black, 0 0.5px black, 0 -0.5px black",
  },
  text: {
    fontSize: 20,
    whiteSpace: "pre-line",
    lineHeight: 1.6,
    fontFamily: "MyCustomFont",
  },
};
