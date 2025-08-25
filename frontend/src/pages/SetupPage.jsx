import { useNavigate } from "react-router-dom";
import { useSelection } from "../context/SelectionContext.jsx";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function SetupPage() {
  const nav = useNavigate();
  const { startLocation, setStartLocation, duration, setDuration, canProceed } = useSelection();
  const {isLoggedIn} = useAuth();

  // UI 상태
  const [showMap, setShowMap] = useState(false);
  const [showDurationInput, setShowDurationInput] = useState(false);
  const [address, setAddress] = useState("");
  const [inputAddr, setInputAddr] = useState("");

  // 지도 관리
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapDivRef = useRef(null);

  // 좌표 → 주소 변환 (역지오코딩)
  const fetchAddress = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      
      //동대문구 체크
      if (data.address.city_district !== "동대문구"){
        alert("동대문구 내에서만 선택 가능합니다.");
        return;
      }

      // 기본 도로명 주소 (road + house_number)
      let baseAddr = "";
      if (data.address.road) {
        baseAddr = `${data.address.road} ${data.address.house_number || ""}`.trim();
      } else {
        baseAddr = data.display_name;
      }

      // 건물 이름 (있으면 괄호 추가)
      let building = "";
      if (data.namedetails && data.namedetails.name) {
        building = ` (${data.namedetails.name})`;
      }

      setAddress(baseAddr + building);
    } catch (e) {
      console.error("역지오코딩 실패:", e);
    }
  };

    // 주소 → 좌표 변환 (지오코딩)
  const searchAddress = async () => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          inputAddr
        )}&format=json&limit=1`
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
        mapRef.current.setView(coords, 15);
        setStartLocation({ lat: coords[0], lng: coords[1] });
        setAddress(data[0].display_name);
      } else {
        alert("주소를 찾을 수 없습니다.");
      }
    } catch (e) {
      console.error("지오코딩 실패:", e);
    }
  };

  // 지도 초기화
  useEffect(() => {
    if (showMap && mapDivRef.current) {
      if (!mapRef.current) {
        // 최초 생성
        mapRef.current = L.map(mapDivRef.current, {
          center: [37.5665, 126.9780],
          zoom: 13,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(mapRef.current);

        mapRef.current.on("click", (e) => {
          const { lat, lng } = e.latlng;
          if (markerRef.current) {
            markerRef.current.setLatLng(e.latlng);
          } else {
            markerRef.current = L.marker(e.latlng).addTo(mapRef.current);
          }
          setStartLocation({ lat, lng });
          fetchAddress(lat, lng);
        });
      } else {
        // 이미 만들어진 지도를 다시 보이게 할 때 크기 재계산
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

      {/* 타이틀 */}
      <h1 style={styles.title}>숨길</h1>
      <h2 style={styles.subtitle}>자연을 걷는 도시, 동대문</h2>

      {/* 버튼들 */}
      <div style={styles.buttons}>
        <button style={styles.btn} onClick={() => setShowMap((prev) => !prev)}>
          시작 위치 선택
        </button>
        {showMap && (
          <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <div ref={mapDivRef} style={styles.map}></div>
          </div>
        )}
        {address && (
          <p style={styles.text}>
            선택된 주소: {address}
          </p>
        )}

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
};


