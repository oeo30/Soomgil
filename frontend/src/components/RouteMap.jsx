import { useEffect, useRef } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function RouteMap({ pathLatLngs = [] }) {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const lineRef = useRef(null);

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
    }

    // 기존 경로 제거 후 새로 그림
    if (lineRef.current) {
      mapRef.current.removeLayer(lineRef.current);
      lineRef.current = null;
    }
    if (pathLatLngs.length > 1) {
      lineRef.current = L.polyline(pathLatLngs, { weight: 4 }).addTo(mapRef.current);
      const bounds = L.latLngBounds(pathLatLngs);
      mapRef.current.fitBounds(bounds, { padding: [24, 24] });
    }
  }, [pathLatLngs]);

  return (
    <div
      ref={mapDivRef}
      style={{
        height: 360,
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid #eee",
      }}
    />
  );
}


