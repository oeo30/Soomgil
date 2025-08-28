import { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelection } from "../context/SelectionContext.jsx";
import RouteMap from "../components/RouteMap.jsx";
import AudioPlayer from "../components/AudioPlayer.jsx";
import { buildMockRoute } from "../utils/mockRoute.js";
import { recommendRoute, getDescription } from "../services/api.js";

export default function ResultPage() {
  const nav = useNavigate();
  const { startLocation, duration, canProceed, address } = useSelection();
  
  // 상태 관리
  const [routeData, setRouteData] = useState(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 만약 조건이 안 채워졌는데 바로 /result로 들어온 경우 → 홈으로 돌려보내기
  useEffect(() => {
    if (!canProceed) nav("/", { replace: true });
  }, [canProceed, nav]);

  // API 호출로 경로 추천
  useEffect(() => {
    if (startLocation && duration) {
      fetchRouteRecommendation();
    }
  }, [startLocation, duration]);

  const fetchRouteRecommendation = async () => {
    setLoading(true);
    setError(null);
    
    // 디버깅: 전달되는 데이터 확인
    console.log('🔍 API 호출 데이터:', {
      startLocation,
      duration,
      address
    });
    
    try {
      const result = await recommendRoute(
        startLocation.lat,
        startLocation.lng,
        duration
      );
      
      setRouteData(result);
      
      // 디버깅: 실제 데이터 확인
      console.log('🔍 실제 경로 데이터:', {
        geojson: result.geojson,
        features: result.geojson?.features,
        firstFeature: result.geojson?.features?.[0]
      });
      
      // 설명 설정
      let descText = `출발지: ${address || "미지정"}\n소요 시간: ${duration ?? "미지정"}분\n\n`;
      
      if (result.description && Array.isArray(result.description)) {
        // 각 경로별 설명 추가
        result.description.forEach((item, index) => {
          descText += `🗺️ ${item.path_name}\n${item.description}\n\n`;
        });
      } else {
        descText += "완만한 보행로와 휴식 포인트를 고려해 추천된 산책 경로입니다.";
      }
      
      setDescription(descText);
      
    } catch (err) {
      console.error('경로 추천 실패:', err);
      setError('경로 추천에 실패했습니다. 다시 시도해주세요.');
      
      // 에러 시 Mock 데이터 사용
      const mockPath = buildMockRoute({ startLocation, duration });
      setRouteData({ geojson: { features: [{ geometry: { coordinates: mockPath } }] } });
      setDescription(`출발지: ${address || "미지정"}
소요 시간: ${duration ?? "미지정"}분
완만한 보행로와 휴식 포인트를 고려해 추천된 산책 경로입니다.`);
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
  loading: { 
    textAlign: "center", 
    padding: "20px", 
    fontSize: "18px",
    fontFamily: "MyCustomFont"
  },
  error: { 
    textAlign: "center", 
    padding: "20px", 
    color: "red", 
    fontSize: "16px",
    fontFamily: "MyCustomFont"
  },
};



