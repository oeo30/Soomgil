import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelection } from "../context/SelectionContext.jsx";
import RouteMap from "../components/RouteMap.jsx";
import AudioPlayer from "../components/AudioPlayer.jsx";
import { buildMockRoute } from "../utils/mockRoute.js";
import { addRouteHistory, getRouteHistory } from "../utils/routeHistory.js";

export default function ResultPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { result, startLocation, duration, mood, address } = location.state || {};
  const { canProceed } = useSelection();

    // ---- 추가: 저장 상태 관리 ----
  const [savedKeys, setSavedKeys] = useState(new Set());
  const [savingKeys, setSavingKeys] = useState(new Set());

  // 잘못 들어온 경우 SetupPage로 리다이렉트
  if (!canProceed || !result) {
    nav("/", { replace: true });
    return null;
  }

  // 경로 설명
  const descriptionList = Array.isArray(result.description)
    ? result.description
    : [
        {
          path_name: "추천 경로",
          description: "완만한 보행로와 휴식 포인트를 고려해 추천된 산책 경로입니다.",
        },
      ];

//임시요약
const makeSummary = (txt, max = 110) =>
  {
    if (!txt) return "";
    const end = txt.indexOf("다.");
    if (end !== -1 && end + 2 <= max) return txt.slice(0, end + 2);
    return txt.length > max ? txt.slice(0, max) + "…" : txt;
  };
        // ---- 추가: 저장 상태 관리 ----
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const makeKey = (item) => `${today}|${address ?? "미지정"}|${duration ?? ""}|${item.path_name}`;

  useEffect(() => {
    // 이미 저장된 항목이면 "저장됨" 상태로 초기화
    const hist = getRouteHistory();
    const s = new Set();
    descriptionList.forEach((item) => {
      const exists = hist.some(
        h =>
          h.date === today &&
          h.title === item.path_name &&
          h.startAddress === (address ?? "미지정") &&
          (h.durationMin ?? null) === (duration ?? null)
      );
      if (exists) s.add(makeKey(item));
    });
    setSavedKeys(s);
  }, [descriptionList, address, duration, today]);

  {/*const makeSummary = (txt, max = 110) => {
    if (!txt) return "";
    const end = txt.indexOf("다.");
    if (end !== -1 && end + 2 <= max) return txt.slice(0, end + 2);
    return txt.length > max ? txt.slice(0, max) + "…" : txt;
  };*/}

  const handleSave = async (item) => {
    const key = makeKey(item);
    if (savedKeys.has(key)) {
      alert("이미 저장한 경로입니다.");
      return;
    }
    if (savingKeys.has(key)) return;

    setSavingKeys(prev => new Set(prev).add(key));

    try
    {
      // ✅ 임시: 프론트에서 요약 생성
      const summary = item.summary ?? makeSummary(item.description, 110);

      const res = addRouteHistory({
        startAddress: address,
        durationMin: duration,
        title: item.path_name,
        summary: item.description_short || summary, // description_short 우선 사용
      });

      setSavedKeys(prev => new Set(prev).add(key));
      if (res.ok) alert("경로가 마이 페이지에 저장되었습니다");
      else alert("이미 저장한 경로입니다.");
    }
    finally
    {
      setSavingKeys(prev =>
      {
        const n = new Set(prev);
        n.delete(key);
        return n;
      });
    }
  };
  // ---- 추가 끝 ----

  // 경로 좌표 추출
  const pathLatLngs = useMemo(() => {
    if (result?.geojson?.features?.[0]?.geometry?.coordinates) {
      return result.geojson.features[0].geometry.coordinates;
    }
    return buildMockRoute({ startLocation, duration });
  }, [result, startLocation, duration]);

  return (
    <div style={styles.page}>
      <div style={styles.backBtn}>
        <button
  onClick={() => nav("/")}
  style={{
    padding: "4px 8px",
    background: "#dadadaff", // 원하는 색상 (hex, rgb, hsl 다 가능)
    color: "black",
  }}
>
  <span style={{ marginRight: "8px" }}>←</span>
</button>

      </div>
      <div>
        <h1 style={styles.title}>추천 산책 경로</h1>

        {/* 지도 */}
        <RouteMap geojsonData={result?.geojson} startLocation={startLocation} />

        {/* 경로 설명 */}
        <div style={{ marginTop: 20 }}>
          <h2 style={styles.subtitle}>🗺️ 경로 설명</h2>
          <p style={styles.text}>
            출발지: {address || "미지정"} <br />
            소요 시간: {duration ?? "미지정"}분 <br />
          </p>

          {descriptionList.map((item, index) => {
            const key = makeKey(item);
            const isSaved = savedKeys.has(key);
            return (
              <div key={index} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <span style={styles.pathName}>{item.path_name}</span>

                  <button
                    onClick={() => (isSaved ? alert("이미 저장한 경로입니다.") : handleSave(item))}
                    style={isSaved ? styles.savedBtn : styles.saveBtn}
                  >
                    {isSaved ? "저장됨" : "경로 저장"}
                  </button>
                </div>

                <p style={styles.text}>{item.description}</p>
              </div>
            );
          })}
        </div>

        {/* 음악 추천 */}
        <div style={{ marginTop: 20 }}>
          <h2 style={styles.subtitle}>🎵 추천 음악</h2>
          <div style={{ marginTop: 20, marginBottom: 40 }}>
            <AudioPlayer mood={mood} />
          </div>
        </div>
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
  pathName: {
    fontSize: 25,
    color: "black",
    marginBottom: 8,
    fontFamily: "MyCustomFont",
    textShadow: "0.5px 0 black, -0.5px 0 black, 0 0.5px black, 0 -0.5px black",
  },
  text: {
    fontSize: 20,
    whiteSpace: "pre-line",
    lineHeight: 1.6,
    fontFamily: "MyCustomFont",
  },
  // ...기존 styles 동일...
  saveBtn: {
    padding: "5px 8px",
    border: "1px solid #ccc",
    borderRadius: 8,
    background: "#f5f5f5",
    cursor: "pointer",
    fontFamily: "MyCustomFont",
  },
  savedBtn: {
    padding: "5px 8px",
    border: "1px solid #ddd",
    borderRadius: 8,
    background: "#e9e9e9",
    color: "#666",
    cursor: "pointer", // 비활성화하지 않고 알림 뜨게 유지
    fontFamily: "MyCustomFont",
  },
};
