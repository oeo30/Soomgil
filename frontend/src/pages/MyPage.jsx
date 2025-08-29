import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { getRouteHistory, clearRouteHistory } from "../utils/routeHistory.js";

export default function MyPage() {
  const nav = useNavigate();

  const nickname = "디디미";
  const profileImg = "/account.png"; // public 폴더에 넣고 "/파일명"으로 불러오기
  const badge = "🥇 초보 산책러";

const [routes, setRoutes] = useState([]);
const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setRoutes(getRouteHistory());   // ✅ sessionStorage에서 불러오기
  }, []);

  // 총 산책 시간(분 단위 합산)
  const totalWalkTime = useMemo(
    () => routes.reduce((acc, r) => acc + (r.durationMin ?? 0), 0),
    [routes]
  );

  // 분 → "시간 분" 변환
  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}시간 ${m}분`;
    if (h > 0) return `${h}시간`;
    return `${m}분`;
  };

  // 전체 경로 삭제 함수
  const handleClearAllRoutes = () => {
    if (window.confirm("모든 산책 기록을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) {
      clearRouteHistory();
      setRoutes([]); // 상태 업데이트
      alert("모든 산책 기록이 삭제되었습니다.");
    }
  };

  // 1시간 = 1스탬프
  const stamps = Math.floor(totalWalkTime / 60);
  const stampImgs = ["/stamps/stamp1.png", "/stamps/stamp2.png"];
  const totalSlots = 10;
  const stampArray = Array.from({ length: totalSlots }).map((_, i) => {
    if (i < stamps) {
      const randIdx = Math.floor(Math.random() * stampImgs.length);
      return { type: "stamp", src: stampImgs[randIdx] };
    } else {
      return { type: "empty" };
    }
  });

  return (
    <div style={styles.page}>
      <div style={styles.backBtn}>
        <button
          onClick={() => nav("/")} // SetupPage의 경로로 이동
          style={{
            padding: "4px 8px",       // px-4 py-2
            backgroundColor: "#ebebebff", // bg-blue-500
            color: "black",             // text-white
            borderRadius: "8px",        // rounded-lg
            border: "none",             // 기본 버튼 테두리 제거
            cursor: "pointer",
            textShadow: "0.3px 0 black, -0.3px 0 black, 0 0.3px black, 0 -0.3px black",
          }}
        >
          <span style={{ marginRight: "8px" }}>←</span>
        </button>
      </div>
      {/* 상단 프로필 + 스탬프판 */}
      <div style={styles.header}>
        {/* 왼쪽 영역: 프로필 */}
        <div style={styles.leftSection}>
          <img src={profileImg} alt="프로필" style={styles.profileImg} />
          <h2 style={styles.nickname}>{nickname}</h2>
        </div>

        {/* 오른쪽 영역: 총 시간 + 스탬프판 + 배지 */}
        <div style={styles.rightSection}>
          <div style={styles.stampBoard}>
            {stampArray.map((item, idx) => (
              <div key={idx} style={styles.stampCell}>
                {item.type === "stamp" ? (
                  <img src={item.src} alt="스탬프" style={styles.stampImg} />
                ) : (
                  <div style={styles.emptyStamp}></div>
                )}
              </div>
            ))}
          </div>
          <span style={styles.totalTime}>
            총 산책 시간: {formatTime(totalWalkTime)}
          </span>
          <span style={styles.badge}>{badge}</span>
        </div>
      </div>

      {/* 산책 기록 */}
      <div style={{ marginTop: 40 }}>
        <div style={styles.recordHeaderSection}>
          <h3 style={styles.subtitle}>🌳 나의 산책 기록</h3>
          {routes.length > 0 && (
            <button 
              onClick={handleClearAllRoutes}
              style={{
                ...styles.clearAllButton,
                background: isHovered ? "#ff5252" : "#ff6b6b"
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              🗑️ 전체 삭제
            </button>
          )}
        </div>
        


        {/* 제목 줄 */}
        <div style={styles.recordHeader}>
          <span>날짜</span>
          <span>출발지</span>
          <span>소요시간</span>
          <span>경로 설명</span>
        </div>
<div style={styles.recordList}>
  {routes.length === 0 && (
    <div style={{ padding: 20, textAlign: "center", fontSize: 18, color: "#666" }}>
      저장된 경로가 없습니다.<br />
      산책 경로를 생성하고 저장해보세요!
    </div>
  )}

  {routes.map((r, idx) => {
    // "서울 동대문구 " 기준으로 분리
    let displayAddr1 = r.startAddress;
    let displayAddr2 = "";
    if (r.startAddress?.includes("동대문구 ")) {
      const [prefix, rest] = r.startAddress.split("동대문구 ");
      displayAddr1 = `${prefix}동대문구`;
      displayAddr2 = rest;
    }

    return (
      <div key={idx} style={styles.recordCard}>
        <span>{r.date}</span>
        <span>
          {displayAddr1}
          {displayAddr2 && (
            <>
              <br />
              {displayAddr2}
            </>
          )}
        </span>
        <span>{formatTime(r.durationMin)}</span>
        <span>{r.summary}</span>
      </div>
    );
  })}
</div>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 1000, margin: "20px auto", padding: 20 },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: 50,
  },
  backBtn:{
    fontSize: 13
  },
  leftSection: {
    display: "flex",
    flexDirection: "column", // 세로 정렬
    alignItems: "center",
    gap: 8,
    width: 200,
  },
  rightSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 20,
  },
  profileImg: {
    width: 150,
    height: 150,
    marginTop: 30,
    marginBottom: -10,
    borderRadius: "50%",
    border: "5px solid #abababff",
    objectFit: "cover",
  },
  nickname: {
    margin: "10px 0 0 0",
    fontSize: 50,
    fontFamily: "MyCustomFont",textShadow: "0.5px 0 black, -0.5px 0 black, 0 0.5px black, 0 -0.5px black",
    marginTop: -5,
    marginBottom: -5,
  },
  badge: {
    background: "#FFD700",
    color: "#000",
    padding: "4px 10px",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: "bold",
    display: "inline-block",
    width: "fit-content",
    marginTop: 20,
  },
  totalTime: {
    marginTop: 4,
    fontSize: 20,
    fontFamily: "MyCustomFont",textShadow: "0.3px 0 black, -0.3px 0 black, 0 0.3px black, 0 -0.3px black",
  },

  stampBoard: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 28px)", // 5칸씩 자동 줄바꿈
    gap: 4,
    marginLeft: -27,
    background: "#f9f9f9",
    padding: 8,
    borderRadius: 12,
    border: "1px solid #ddd",
    transform: "scale(1.1)",
    marginTop: 15,
  },
  stampCell: {
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  stampImg: { width: 24, height: 24 },
  emptyStamp: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    border: "2px solid #ccc",
    background: "#fff",
  },
  subtitle: { fontSize: 35, marginTop: 0, marginBottom: 0, fontFamily: "MyCustomFont",textShadow: "0.5px 0 black, -0.5px 0 black, 0 0.5px black, 0 -0.5px black", },
  recordHeaderSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  clearAllButton: {
    background: "#ff6b6b",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "16px",
    cursor: "pointer",
    fontFamily: "MyCustomFont",
    fontWeight: "bold",
    transition: "background-color 0.2s",
  },
  recordHeader: {
    fontSize: 25,
    display: "grid",
    gridTemplateColumns: "1fr 2fr 1fr 3fr",
    fontWeight: "bold",
    padding: "12px",
    borderBottom: "2px solid #ccc",
    marginBottom: 8,
    textAlign: "center",
    fontFamily: "MyCustomFont",textShadow: "0.5px 0 black, -0.5px 0 black, 0 0.5px black, 0 -0.5px black",
    whiteSpace: "nowrap",
  },
  recordList: { fontSize: 20, display: "flex", flexDirection: "column", gap: 8, fontFamily: "MyCustomFont",textShadow: "0.3px 0 black, -0.3px 0 black, 0 0.3px black, 0 -0.3px black", },
  recordCard: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr 1fr 3fr",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #ddd",
    background: "#fff",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    textAlign: "center",
  },
};

