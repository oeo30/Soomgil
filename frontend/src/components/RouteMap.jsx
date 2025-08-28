import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function RouteMap({ geojsonData, startLocation }) {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const linesRef = useRef([]);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapDivRef.current) return;

    // 최초 1회 지도 생성
    if (!mapRef.current) {
      mapRef.current = L.map(mapDivRef.current, {
        center: [37.5665, 126.9780], // 임시 센터
        zoom: 14,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(mapRef.current);
      
      // 지도 로딩 완료 시 상태 업데이트
      mapRef.current.whenReady(() => {
        setMapLoaded(true);
      });
    }

    // 기존 경로들과 마커들 제거
    linesRef.current.forEach(line => {
      if (mapRef.current.hasLayer(line)) {
        mapRef.current.removeLayer(line);
      }
    });
    linesRef.current = [];
    
    markersRef.current.forEach(marker => {
      if (mapRef.current.hasLayer(marker)) {
        mapRef.current.removeLayer(marker);
      }
    });
    markersRef.current = [];

    // 새로운 경로들 그리기
    if (geojsonData?.features) {
      const colors = { 'mountain': 'green', 'river': 'blue', 'park': 'orange' };
      const allBounds = [];
      
      geojsonData.features.forEach(feature => {
        if (feature.geometry?.coordinates) {
          const coordinates = feature.geometry.coordinates.map(coord => [coord[1], coord[0]]); // [lon, lat] -> [lat, lon]
          const color = colors[feature.properties?.name] || 'red';
          
          const line = L.polyline(coordinates, { 
            weight: 4, 
            color: color,
            opacity: 0.8 
          }).addTo(mapRef.current);
          
          linesRef.current.push(line);
          allBounds.push(...coordinates);
        }
      });

      // 모든 경로가 보이도록 지도 범위 조정
      if (allBounds.length > 0) {
        const bounds = L.latLngBounds(allBounds);
        mapRef.current.fitBounds(bounds, { padding: [24, 24] });
      }
    }
    
    // 출발지 마커 추가
    if (startLocation?.lat && startLocation?.lng) {
      const startIcon = L.divIcon({
        html: '<div style="background-color: #000000; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>',
        className: 'custom-div-icon',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
      
      const startMarker = L.marker([startLocation.lat, startLocation.lng], { icon: startIcon })
        .addTo(mapRef.current)
        .bindPopup('<b>🚶‍♂️ 출발지</b>');
      
      markersRef.current.push(startMarker);
    }
    
    // 목적지 마커들 추가 (각 경로의 끝점)
    if (geojsonData?.features) {
      geojsonData.features.forEach((feature, index) => {
        if (feature.geometry?.coordinates && feature.geometry.coordinates.length > 0) {
          const lastCoord = feature.geometry.coordinates[feature.geometry.coordinates.length - 1];
          const endLat = lastCoord[1];
          const endLng = lastCoord[0];
          
          const colors = { 'mountain': '#4CAF50', 'river': '#2196F3', 'park': '#FF9800' };
          const color = colors[feature.properties?.name] || '#F44336';
          
          const endIcon = L.divIcon({
            html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
            className: 'custom-div-icon',
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          });
          
          const endMarker = L.marker([endLat, endLng], { icon: endIcon })
            .addTo(mapRef.current)
            .bindPopup(`<b>🎯 ${feature.properties?.name || '목적지'}</b>`);
          
          markersRef.current.push(endMarker);
        }
      });
    }
  }, [geojsonData, startLocation]);

  return (
    <div
      ref={mapDivRef}
      style={{
        height: 360,
        width: "100%",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid #eee",
        backgroundColor: "#f0f0f0", // 배경색 추가로 지도 영역 확인
        minHeight: 360, // 최소 높이 보장
        position: "relative",
      }}
    >
      {!mapLoaded && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          color: "#666",
          fontSize: "16px",
          fontFamily: "MyCustomFont"
        }}>
          지도를 로딩 중입니다...
        </div>
      )}
    </div>
  );
}


