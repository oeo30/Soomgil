import { useNavigate } from "react-router-dom";
import { useSelection } from "../context/SelectionContext.jsx";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function SetupPage() {
  const nav = useNavigate();
  const { startLocation, setStartLocation, duration, setDuration, canProceed } = useSelection();
  const { isLoggedIn } = useAuth();

  const [showMap, setShowMap] = useState(false);
  const [showDurationInput, setShowDurationInput] = useState(false);
  const [address, setAddress] = useState("");

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapDivRef = useRef(null);
  const boundaryLayerRef = useRef(null); // 동대문구 경계 레이어 저장

  // 주소 포맷 함수
  const formatAddress = (addr, namedetails) => {
    const city = addr.city || addr.state || "";
    const district =
      addr.city_district || addr.borough || addr.county || addr.state_district || "";
    const road = addr.road || "";
    const houseNo = addr.house_number || "";

    let baseAddr = `${city} ${district} ${road} ${houseNo}`.trim();

    let building = "";
    if (namedetails && namedetails.name) {
      building = ` (${namedetails.name})`;
    }
    return baseAddr + building;
  };

  // 좌표 → 주소 변환
  const fetchAddress = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&namedetails=1`
      );
      const data = await res.json();

      if (!data.display_name.includes("동대문구")) {
        alert("동대문구 내에서만 선택 가능합니다.");
        setAddress("");
        if (markerRef.current) {
          mapRef.current.removeLayer(markerRef.current);
          markerRef.current = null;
        }
        return;
      }

      setAddress(formatAddress(data.address, data.namedetails));
    } catch (e) {
      console.error("역지오코딩 실패:", e);
    }
  };

  // 주소 → 좌표 변환
  const searchAddress = async () => {
    try {
      let query = address.replace(/\s+/g, "");
      query = query.replace(/(로|길)(\d+)/g, "$1 $2");

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&limit=1&addressdetails=1&namedetails=1`
      );
      const data = await res.json();

      if (data.length > 0) {
        const { lat, lon } = data[0];
        const coords = [parseFloat(lat), parseFloat(lon)];

        if (markerRef.current) {
          markerRef.current.setLatLng(coords);
        } else {
          markerRef.current = L.marker(coords).addTo(mapRef.current);
        }

        if (mapRef.current) {
          mapRef.current.setView(coords, 15);
        }

        setStartLocation({ lat: coords[0], lng: coords[1] });
        await fetchAddress(coords[0], coords[1]);
      } else {
        alert("주소를 찾을 수 없습니다.");
        setAddress("");
      }
    } catch (e) {
      console.error("지오코딩 실패:", e);
    }
  };

  // 지도 초기화
  useEffect(() => {
    if (showMap && mapDivRef.current) {
      if (!mapRef.current) {
        const mapInstance = L.map(mapDivRef.current, {
          center: [37.5839, 127.0559], // 동대문구 중심 근처
          zoom: 13,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(mapInstance);

        mapRef.current = mapInstance;

        // ✅ 지도 클릭 시 → 마커 + 주소 표시
        mapInstance.on("click", async (e) => {
          const { lat, lng } = e.latlng;
          if (markerRef.current) {
            markerRef.current.setLatLng(e.latlng);
          } else {
            markerRef.current = L.marker(e.latlng).addTo(mapInstance);
          }
          setStartLocation({ lat, lng });
          await fetchAddress(lat, lng);
        });

        // ✅ 동대문구 경계 표시 (GeoJSON)
        fetch(
          "https://nominatim.openstreetmap.org/search.php?q=동대문구&polygon_geojson=1&format=json"
        )
          .then((res) => res.json())
          .then((data) => {
            if (data.length > 0 && data[0].geojson) {
              if (boundaryLayerRef.current) {
                mapInstance.removeLayer(boundaryLayerRef.current);
              }
              boundaryLayerRef.current = L.geoJSON(data[0].geojson, {
                style: {
                  color: "red",
                  weight: 2,
                  fill: false,
                },
              }).addTo(mapInstance);

              mapInstance.fitBounds(boundaryLayerRef.current.getBounds());
            }
          });
      } else {
        setTimeout(() => {
          mapRef.current.invalidateSize();
        }, 100);
      }
    }
  }, [showMap, setStartLocation]);

  return (
    <div style={styles.page}>
      {/* 헤더 */}
      <div style={styles.header}>
        <div></div>
        <div>
          {isLoggedIn ? (
            <button style={styles.headerBtn} onClick={() => nav("/mypage")}>
              My Page
            </button>
          ) : (
            <button style={styles.headerBtn} onClick={() => nav("/login")}>
              Google 로그인
            </button>
          )}
        </div>
      </div>

      <h1 style={styles.title}>숨길</h1>
      <h2 style={styles.subtitle}>자연을 걷는 도시, 동대문</h2>

      <div style={styles.buttons}>
        <button style={styles.btn} onClick={() => setShowMap((prev) => !prev)}>
          시작 위치 선택
        </button>

        {showMap && (
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* 주소 입력칸 */}
            <div style={styles.addressBox}>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="도로명 주소 입력하기"
                style={styles.addressInput}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    searchAddress();
                  }
                }}
              />
              <button onClick={searchAddress} style={styles.searchBtn}>
                확인
              </button>
            </div>

            {/* 지도 */}
            <div ref={mapDivRef} style={styles.map}></div>
          </div>
        )}

        {address && <p style={styles.text}>선택된 위치: {address}</p>}

        <button style={styles.btn} onClick={() => setShowDurationInput((prev) => !prev)}>
          소요 시간 선택
        </button>
        {showDurationInput && (
          <div style={{ marginTop: 10 }}>
            <input
              type="number"
              min="5"
              max="120"
              step="5"
              value={duration ?? ""}
              onChange={(e) => setDuration(Number(e.target.value))}
              style={styles.input}
              placeholder="5 ~ 120분"
            />
          </div>
        )}

        <button
          style={{
            ...styles.btn,
            background: canProceed ? "#4f46e5" : "#aaa",
            marginTop: 20,
          }}
          disabled={!canProceed}
          onClick={() => nav("/result")}
        >
          다음으로
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 720, margin: "20px auto", padding: 20, textAlign: "center" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerBtn: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
  },
  title: { fontSize: 36, marginBottom: 8 },
  subtitle: { fontSize: 18, marginBottom: 24, color: "#555" },
  buttons: { display: "flex", flexDirection: "column", gap: 16, alignItems: "center" },
  btn: {
    padding: "12px 20px",
    border: "none",
    borderRadius: 8,
    background: "#4f46e5",
    color: "#fff",
    fontSize: 16,
    cursor: "pointer",
    width: "60%",
  },
  map: { height: 300, width: "90%", marginTop: 10, borderRadius: 12, border: "1px solid #ccc" },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ccc",
    width: "120px",
    textAlign: "center",
  },
  text: { fontSize: 14, marginTop: 6, color: "#333" },
  addressBox: {
    marginTop: 12,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  addressInput: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #ccc",
    fontSize: 14,
    minWidth: "280px",
  },
  searchBtn: {
    padding: "10px 16px",
    borderRadius: 12,
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    cursor: "pointer",
  },
};




