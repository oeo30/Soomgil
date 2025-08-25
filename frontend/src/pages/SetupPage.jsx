import { useNavigate } from "react-router-dom";
import { useSelection } from "../context/SelectionContext.jsx";
import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function SetupPage() {
  const nav = useNavigate();
  const { startLocation, setStartLocation, duration, setDuration, canProceed } = useSelection();

  // UI 상태
  const [showMap, setShowMap] = useState(false);
  const [showDurationInput, setShowDurationInput] = useState(false);
  const [isLoggedIn] = useState(false); // 임시 로그인 상태

  // 지도 관리
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapDivRef = useRef(null);

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
              로그인/회원가입
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
        {startLocation && (
          <p style={styles.text}>
            선택된 좌표: {startLocation.lat.toFixed(5)}, {startLocation.lng.toFixed(5)}
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


