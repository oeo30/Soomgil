import { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelection } from "../context/SelectionContext.jsx";
import RouteMap from "../components/RouteMap.jsx";
import AudioPlayer from "../components/AudioPlayer.jsx";
import { buildMockRoute } from "../utils/mockRoute.js";
import { recommendRoute } from "../services/api.js";

export default function ResultPage() {
  const nav = useNavigate();
  const { startLocation, duration, canProceed, address } = useSelection();
  
  // 상태 관리
  const [routeData, setRouteData] = useState(null);
  const [descriptionList, setDescriptionList] = useState([]); // 배열로 저장
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 조건 체크
  useEffect(() => {
    if (!canProceed) nav("/", { replace: true });
  }, [canProceed, nav]);

  // API 호출
  useEffect(() => {
    if (startLocation && duration) {
      fetchRouteRecommendation();
    }
  }, [startLocation, duration]);

  const fetchRouteRecommendation = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await recommendRoute(
        startLocation.lat,
        startLocation.lng,
        duration
      );

      setRouteData(result);

      // description이 배열 형태라면 그대로 저장
      if (result.description && Array.isArray(result.description)) {
        setDescriptionList(result.description);
      } else {
        setDescriptionList([
          {
            path_name: "추천 경로",
            description: "완만한 보행로와 휴식 포인트를 고려해 추천된 산책 경로입니다."
          }
        ]);
      }

    } catch (err) {
      console.error("경로 추천 실패:", err);
      setError("경로 추천에 실패했습니다. 다시 시도해주세요.");

      // 에러 시 Mock 데이터 사용
      const mockPath = buildMockRoute({ startLocation, duration });
      setRouteData({ geojson: { features: [{ geometry: { coordinates: mockPath } }] } });
      setDescriptionList([
        {
          path_name: "추천 경로",
          description: "완만한 보행로와 휴식 포인트를 고려해 추천된 산책 경로입니다."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 경로 좌표 추출
  const pathLatLngs = useMemo(() => {
    if (routeData?.geojson?.features?.[0]?.geometry?.coordinates) {
      return routeData.geojson.features[0].geometry.coordinates;
    }
    return buildMockRoute({ startLocation, duration });
  }, [routeData, startLocation, duration]);

  return (
    <div style={styles.page}>
      <div style={styles.backBtn}>
        <button
          onClick={() => nav("/")} // SetupPage의 경로로 이동
          className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow"
        >
          <span className="mr-2">←</span>
        </button>
      </div>
      <div>
        <h1 style={styles.title}>추천 산책 경로</h1>

        {/* 로딩 상태 */}
        {loading && (
          <div style={styles.loading}>
            <p>경로를 생성하고 있습니다...</p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div style={styles.error}>
            <p>{error}</p>
          </div>
        )}

        {/* 지도 */}
        <RouteMap geojsonData={routeData?.geojson} startLocation={startLocation} />

        {/* 경로 설명 */}
        <div style={{ marginTop: 20 }}>
          <h2 style={styles.subtitle}>경로 설명</h2>

          <p style={styles.text}>
            출발지: {address || "미지정"} <br />
            소요 시간: {duration ?? "미지정"}분
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
          <h2 style={styles.subtitle}>추천 음악 🎵</h2>
          <div style={{ marginBottom: 40 }}>
            <AudioPlayer src="/sample.mp3" />
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
  backBtn:{
    fontSize: 13
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: -10,
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
    fontSize: 35,
    color: "black",
    marginBottom: 8,
    fontFamily: "MyCustomFont",
    textShadow:
      "0.5px 0 black, -0.5px 0 black, 0 0.5px black, 0 -0.5px black",
  },
  pathName: {
    fontSize: 25,
    color: "black",
    marginBottom: 8,
    fontFamily: "MyCustomFont",
    textShadow:
      "0.5px 0 black, -0.5px 0 black, 0 0.5px black, 0 -0.5px black",
  },
  text: {
    fontSize: 20,
    whiteSpace: "pre-line",
    lineHeight: 1.6,
    fontFamily: "MyCustomFont",
  },
  loading: {
    textAlign: "center",
    padding: "20px",
    fontSize: "18px",
    fontFamily: "MyCustomFont",
  },
  error: {
    textAlign: "center",
    padding: "20px",
    color: "red",
    fontSize: "16px",
    fontFamily: "MyCustomFont",
  },
};
