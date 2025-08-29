import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import RouteMap from "../components/RouteMap.jsx";

export default function RecommendationPage1() {
  const nav = useNavigate();
  const location = useLocation();
  const { recommendedPlace, userPreference, currentLocation } = location.state || {};

  const [routeData, setRouteData] = useState(null);
  const [error, setError] = useState(null);

  // 추천된 장소로 경로 생성
  useEffect(() => {
    if (!recommendedPlace || !currentLocation) {
      setError("추천 장소 또는 현재 위치 정보가 없습니다.");
      return;
    }

    generateRouteToRecommendedPlace();
  }, [recommendedPlace, currentLocation]);

  const generateRouteToRecommendedPlace = async () => {
    try {
      // final_edges.geojson에서 목적지와 일치하는 가장 가까운 엣지 찾기
      const edgeResponse = await fetch('http://localhost:5001/api/find-destination-edge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: recommendedPlace,
          current_lat: currentLocation.lat,
          current_lon: currentLocation.lng
        })
      });

      const edgeResult = await edgeResponse.json();
      
      if (!edgeResult.success) {
        setError(edgeResult.error || "목적지 엣지를 찾을 수 없습니다.");
        return;
      }

      // 찾은 엣지의 중점을 목적지로 사용하여 개인화된 경로 생성
      const routeResponse = await fetch('http://localhost:5001/api/generate-personalized-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_lat: currentLocation.lat,
          start_lon: currentLocation.lng,
          destination_lat: edgeResult.mid_lat,
          destination_lon: edgeResult.mid_lon,
          destination_name: recommendedPlace
        })
      });

      const routeResult = await routeResponse.json();
      
      if (routeResult.success && routeResult.geojson) {
        setRouteData({
          geojson: routeResult.geojson,
          description: routeResult.description
        });
      } else {
        setError(routeResult.error || "경로 생성에 실패했습니다.");
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
        <h1 style={styles.title}>추천 경로</h1>
        
        {/* 추천 정보 */}
        <div style={{ marginTop: 20 }}>
          <h2 style={styles.subtitle}>🎯 개인화 추천</h2>
          <p style={styles.text}>
            추천 장소: {recommendedPlace}
          </p>
        </div>

        {/* 지도 */}
        <div style={{ marginTop: 20 }}>
          <h2 style={styles.subtitle}>🗺️ 추천 경로</h2>
          <div style={styles.mapContainer}>
            <div style={styles.mapHeader}>
              <p style={styles.mapTitle}>
                {recommendedPlace}까지 경로를 표시합니다
              </p>
            </div>
            <div style={styles.mapWrapper}>
              <RouteMap 
                geojsonData={routeData?.geojson} 
                startLocation={currentLocation}
                destination={recommendedPlace}
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
  },
  featuresContainer: {
    background: "rgba(255, 255, 255, 0.9)",
    padding: 20,
    borderRadius: 15,
    border: "2px solid #e0e0e0",
  },
  featureItem: {
    display: "flex",
    alignItems: "flex-start",
    padding: "15px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 15,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    margin: "0 0 8px 0",
    fontFamily: "MyCustomFont",
  },
  featureText: {
    fontSize: 16,
    color: "#666",
    lineHeight: 1.5,
    margin: 0,
    fontFamily: "MyCustomFont",
  }
};
