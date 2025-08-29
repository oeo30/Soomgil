import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function CustomResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [map, setMap] = useState(null);
  const [resultData, setResultData] = useState(null);

  // 컴포넌트 마운트 시 상태 초기화 (한 번만 실행)
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (!isInitialized) {
      console.log("🔄 CustomResultPage 마운트");
      setResultData(null);
      setIsInitialized(true);
      
      // 브라우저 캐시 클리어 (개발용)
      if (process.env.NODE_ENV === 'development') {
        console.log("🧹 개발 모드: 캐시 클리어");
      }
    }
  }, [isInitialized]);

  useEffect(() => {
    // location.state에서 새로운 데이터가 있으면 업데이트
    if (location.state?.result) {
      console.log("🔄 새로운 결과 데이터 받음");
      console.log("📊 결과 데이터:", location.state.result);
      console.log("📊 이미지 소스:", location.state.result.properties?.image_source);
      console.log("📊 생성 시간:", location.state.result.properties?.generated_at);
      setResultData(location.state.result);
    } else {
      console.log("❌ 결과 데이터 없음 - CustomWalkPage로 리다이렉트");
      // 결과 데이터가 없으면 즉시 CustomWalkPage로 리다이렉트
      setTimeout(() => {
        navigate("/custom-walk", { replace: true });
      }, 100);
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (map && resultData) {
      // 기존 레이어 제거
      map.eachLayer((layer) => {
        if (layer instanceof L.GeoJSON) {
          map.removeLayer(layer);
        }
      });
      
      // GeoJSON의 각 feature를 개별적으로 처리하여 색상 적용
      resultData.features.forEach((feature) => {
        const style = {
          color: feature.properties.color || "#0066cc",
          weight: feature.properties.weight || 3,
          opacity: feature.properties.opacity || 0.9
        };
        
        const layer = L.geoJSON(feature, { style }).addTo(map);
        
        // 첫 번째 레이어의 bounds로 지도 맞추기
        if (feature === resultData.features[0]) {
          map.fitBounds(layer.getBounds());
        }
      });
    }
  }, [map, resultData]);

  useEffect(() => {
  if (!map) {
    // 이미 생성된 지도 있으면 제거
    const existingMap = L.DomUtil.get("map");
    if (existingMap != null) {
      existingMap._leaflet_id = null;
    }

    const mapInstance = L.map("map", {
      center: [37.5839, 127.0559],
      zoom: 13,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(mapInstance);

    setMap(mapInstance);
  }
}, [map]);


return (
  <div style={{ textAlign: "center", padding: 20, marginTop: 40, position: "relative" }}>
    {/* 우상단 버튼 */}
    <button
      onClick={() => navigate("/")}
      style={{
        position: "absolute",
        top: 20,
        left: 20,
        padding: "6px 12px",
        backgroundColor: "#dadadaff",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "14px",
      }}
    >
      ← 
    </button>

    <h1
      style={{
        marginTop: 30,
        fontSize: 60,
        color: "black",
        fontFamily: "MyCustomFont",
        textShadow: "0.5px 0 black, -0.5px 0 black, 0 0.5px black, 0 -0.5px black",
      }}
    >
      나만의 산책로
    </h1>

    <div id="map" style={{ height: 400, width: "100%", marginTop: -10 }}></div>
  </div>
);
}