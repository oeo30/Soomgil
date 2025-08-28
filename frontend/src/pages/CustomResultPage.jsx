import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function CustomResultPage() {
  const location = useLocation();
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (map && location.state?.result) {
      const pathLayer = L.geoJSON(location.state.result, {
        style: { color: "blue", weight: 3 },
      }).addTo(map);
      map.fitBounds(pathLayer.getBounds());
    }
  }, [map, location.state]);

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
    <div style={{ textAlign: "center", padding: 20, marginTop: 40,}}>
      <h1
        style={{
          marginTop: 30,
          fontSize: 60,
          color: "black",
          fontFamily: "MyCustomFont",
          textShadow:
            "0.5px 0 black, -0.5px 0 black, 0 0.5px black, 0 -0.5px black",
        }}
      >나만의 산책로
      </h1>
      <div id="map" style={{ height: 400, width: "100%", marginTop: -10 }}></div>
    </div>
  );
}
