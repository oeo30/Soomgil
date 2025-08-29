import { useNavigate } from "react-router-dom";

export default function MyPage() {
  const nav = useNavigate();

  const nickname = "디디미";
  const profileImg = "/account.png"; // public 폴더에 넣고 "/파일명"으로 불러오기
  const badge = "🥇 초보 산책러";
  const totalWalkTime = 380; // 분 단위

  // 분 → "시간 분" 변환
  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}시간 ${m}분`;
    if (h > 0) return `${h}시간`;
    return `${m}분`;
  };

  // 산책 기록 5개 (날짜 내림차순 정렬)
  const routes = [
    {
      date: "2025-08-29",
      startLocation: "서울 동대문구 회기로 85",
      duration: 60,
      description: "한적한 대학교 주변 코스로 산책",
    },
    {
      date: "2025-08-27",
      startLocation: "서울 동대문구 전농로 90",
      duration: 45,
      description: "서울시립대 앞 산책로와 정원 탐방",
    },
    {
      date: "2025-08-25",
      startLocation: "서울 동대문구 왕산로 214",
      duration: 30,
      description: "동대문역 인근 청계천 따라 가볍게 걷기",
    },
    {
      date: "2025-08-22",
      startLocation: "서울 동대문구 청계천로 421",
      duration: 50,
      description: "청계천 보행로 따라 여유롭게 산책",
    },
    {
      date: "2025-08-20",
      startLocation: "서울 동대문구 답십리로 210",
      duration: 80,
      description: "답십리공원과 이어지는 산책 코스",
    },
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  // 1시간 = 1스탬프
  const stamps = Math.floor(totalWalkTime / 60);

  // 스탬프 이미지들 (public 폴더에 넣기)
  const stampImgs = [
    "/stamps/stamp1.png",
    "/stamps/stamp2.png"
  ];

  // 총 10칸
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
          <span style={styles.totalTime}>
            총 산책 시간: {formatTime(totalWalkTime)}
          </span>
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
          <span style={styles.badge}>{badge}</span>
        </div>
      </div>

      {/* 산책 기록 */}
      <div style={{ marginTop: 40 }}>
        <h3 style={styles.subtitle}>🌳 나의 산책 기록</h3>

        {/* 제목 줄 */}
        <div style={styles.recordHeader}>
          <span>날짜</span>
          <span>출발지</span>
          <span>소요시간</span>
          <span>경로 설명</span>
        </div>

        {/* 실제 기록 */}
        <div style={styles.recordList}>
          {routes.map((r, idx) => {
    // "서울 동대문구 " 기준으로 분리
    const [prefix, rest] = r.startLocation.split("동대문구 ");
    return (
      <div key={idx} style={styles.recordCard}>
        <span>{r.date}</span>
        <span>
          {prefix}동대문구
          <br />
          {rest}
        </span>
        <span>{formatTime(r.duration)}</span>
        <span>{r.description}</span>
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
    background: "#f9f9f9",
    padding: 8,
    borderRadius: 12,
    border: "1px solid #ddd",
    transform: "scale(1.2)",
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

