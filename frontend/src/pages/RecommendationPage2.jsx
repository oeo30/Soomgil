import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import RouteMap from "../components/RouteMap.jsx";

export default function RecommendationPage2() {
  const nav = useNavigate();
  const location = useLocation();
  const { durationType, currentLocation } = location.state || {};

  const [routeData, setRouteData] = useState(null);
  const [error, setError] = useState(null);

  // 시간대별 추천 경로 생성
  useEffect(() => {
    if (!durationType || !currentLocation) {
      setError("시간대별 추천 정보 또는 현재 위치 정보가 없습니다.");
      return;
    }

    generateDurationBasedRoute();
  }, [durationType, currentLocation]);

  const generateDurationBasedRoute = async () => {
    try {
      // TODO: 시간대별 경로 추천 로직을 여기에 구현할 예정
      // 현재는 기본 경로 생성 API 사용
      const response = await fetch('http://localhost:5001/api/routes/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_lat: currentLocation.lat,
          start_lon: currentLocation.lng,
          duration_min: 60, // 기본값
          mood: "활기찬"
        })
      });

      const result = await response.json();
      
      if (result.success && result.geojson) {
        setRouteData({
          geojson: result.geojson,
          description: result.description
        });
      } else {
        setError(result.error || "경로 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("경로 생성 중 오류:", error);
      setError("경로 생성 중 오류가 발생했습니다.");
    }
  };

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.errorContainer}>
          <h2>오류가 발생했습니다</h2>
          <p>{error}</p>
          <button onClick={() => nav("/")} style={styles.backButton}>
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.backBtn}>
        <button
          onClick={() => nav("/")}
          style={{
            padding: "4px 8px",
            background: "#dadadaff",
            color: "black",
          }}
        >
          <span style={{ marginRight: "8px" }}>←</span>
        </button>
      </div>

      <div>
        <h1 style={styles.title}>시간대별 추천 경로</h1>
        
        {/* 추천 정보 */}
        <div style={{ marginTop: 20 }}>
          <h2 style={styles.subtitle}>🎯 시간대별 개인화 추천</h2>
          <p style={styles.text}>
            추천 유형: {durationType === 'long' ? '긴 코스' : durationType === 'short' ? '짧은 코스' : '변주 코스'}
          </p>
        </div>

        {/* 지도 */}
        <div style={{ marginTop: 20 }}>
          <h2 style={styles.subtitle}>🗺️ 추천 경로</h2>
          <div style={styles.mapContainer}>
            <div style={styles.mapHeader}>
              <p style={styles.mapTitle}>
                {durationType === 'long' && "🌿 긴 코스로 색다른 여유를 느껴보세요!"}
                {durationType === 'short' && "☀️ 짧고 산뜻한 산책으로 새로운 리듬을 느껴보세요!"}
                {durationType === 'variation' && "🌸 새로운 산책 경험을 시작해보세요!"}
              </p>
            </div>
            <div style={styles.mapWrapper}>
              <RouteMap 
                geojsonData={routeData?.geojson} 
                startLocation={currentLocation}
                destination="시간대별 추천 경로"
              />
            </div>
          </div>
        </div>

        {/* 경로 정보 */}
        {routeData?.geojson?.features?.[0]?.properties && (
          <div style={{ marginTop: 20 }}>
            <h2 style={styles.subtitle}>📊 경로 정보</h2>
            <div style={styles.routeInfoContainer}>
              <div style={styles.routeInfoItem}>
                <span style={styles.routeInfoLabel}>총 거리:</span>
                <span style={styles.routeInfoValue}>
                  {routeData.geojson.features[0].properties.length_km} km
                </span>
              </div>
              <div style={{...styles.routeInfoItem, borderBottom: "none"}}>
                <span style={styles.routeInfoLabel}>예상 소요 시간:</span>
                <span style={styles.routeInfoValue}>
                  {routeData.geojson.features[0].properties.estimated_time_min}분
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 경로 설명 */}
        {routeData?.description && (
          <div style={{ marginTop: 20 }}>
            <h2 style={styles.subtitle}>📝 경로 설명</h2>
            <p style={styles.text}>{routeData.description}</p>
          </div>
        )}
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
  text: {
    fontSize: 20,
    lineHeight: 1.6,
    fontFamily: "MyCustomFont",
  },
  errorContainer: {
    textAlign: "center",
    padding: 40,
  },
  backButton: {
    padding: "12px 24px",
    background: "#3a893e",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 16,
    fontFamily: "MyCustomFont",
  },
  mapContainer: {
    background: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
    border: "2px solid #e0e0e0",
    overflow: "hidden",
  },
  mapHeader: {
    background: "#3a893e",
    color: "white",
    padding: "15px 20px",
    textAlign: "center",
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: "bold",
    margin: 0,
    fontFamily: "MyCustomFont",
  },
  mapWrapper: {
    height: 400,
    width: "100%",
  },
  routeInfoContainer: {
    background: "rgba(255, 255, 255, 0.9)",
    padding: 20,
    borderRadius: 15,
    border: "2px solid #e0e0e0",
  },
  routeInfoItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  routeInfoLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    fontFamily: "MyCustomFont",
  },
  routeInfoValue: {
    fontSize: 18,
    color: "#3a893e",
    fontWeight: "bold",
    fontFamily: "MyCustomFont",
  }
};
