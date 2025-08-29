import { useNavigate } from "react-router-dom";
import { useSelection } from "../context/SelectionContext.jsx";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FaChevronRight, FaChevronDown } from "react-icons/fa";
import { getRouteHistory } from "../utils/routeHistory.js";
import { getPersonalizedMessages } from "../services/api.js";


export default function SetupPage() {
  const nav = useNavigate();
  const { startLocation, setStartLocation, duration, setDuration, canProceed, setAddress, address } = useSelection();
  const { isLoggedIn } = useAuth();

  const [showMap, setShowMap] = useState(false);
  const [showDurationInput, setShowDurationInput] = useState(false);
  const [showMoodInput, setShowMoodInput] = useState(false);
  const [mood, setMood] = useState("");
  const [personalizedMessages, setPersonalizedMessages] = useState([
    "🌼 동대문구의 숨은 산책로를 찾아보아요!"
  ]);


  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapDivRef = useRef(null);
  const boundaryLayerRef = useRef(null); // 동대문구 경계 레이어 저장

  // 시간대별 선호도 분석 함수
  const getDurationPreference = () => {
    const userHistory = getRouteHistory();
    if (!userHistory || userHistory.length === 0) {
      return 'medium'; // 기본값
    }

    // 최근 5개 기록의 평균 산책 시간 계산
    const recentHistory = userHistory.slice(0, 5);
    const totalDuration = recentHistory.reduce((sum, record) => {
      return sum + (record.durationMin || 30); // 기본값 30분
    }, 0);
    const avgDuration = totalDuration / recentHistory.length;

    // 선호도 분류
    if (avgDuration <= 30) {
      return 'short';
    } else if (avgDuration <= 90) {
      return 'medium';
    } else {
      return 'long';
    }
  };

  // 개인화된 메시지 가져오기
  const fetchPersonalizedMessages = async () => {
    try {
      const userHistory = getRouteHistory();
      console.log("🔍 사용자 산책 기록:", userHistory);
      console.log("🔍 기록 개수:", userHistory ? userHistory.length : 0);
      
      // routeHistory가 없으면 기본 메시지만 표시
      if (!userHistory || userHistory.length === 0) {
        console.log("⚠️ 기록이 없어서 기본 메시지 표시");
        setPersonalizedMessages(["🌼 동대문구의 숨은 산책로를 찾아보아요!"]);
        return;
      }
      
      console.log("🚀 API 호출 시작...");
      const result = await getPersonalizedMessages(userHistory);
      console.log("✅ 개인화 API 응답:", result);
      
      if (result.success && result.messages) {
        console.log("🎉 개인화 메시지 설정:", result.messages);
        setPersonalizedMessages(result.messages);
        
        // 가장 최근 방문한 장소의 좌표가 있으면 시작 위치로 설정
        if (result.latest_coordinates) {
          console.log("📍 최근 방문 위치로 시작점 설정:", result.latest_coordinates);
          setStartLocation(result.latest_coordinates);
          
          // 주소도 함께 업데이트
          await fetchAddress(result.latest_coordinates.lat, result.latest_coordinates.lng);
        }
      } else {
        console.log("❌ API 응답 실패 또는 메시지 없음");
        setPersonalizedMessages(["🌼 동대문구의 숨은 산책로를 찾아보아요!"]);
      }
    } catch (error) {
      console.error("💥 개인화 메시지 가져오기 실패:", error);
      // 에러 발생 시에도 기본 메시지 표시
      setPersonalizedMessages(["🌼 동대문구의 숨은 산책로를 찾아보아요!"]);
    }
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

      const addr = data.address || {};
      const city = addr.city || addr.state || "";
      const district =
        addr.city_district || addr.borough || addr.county || addr.state_district || "";
      const road = addr.road || "";
      const houseNo = addr.house_number || "";

      let baseAddr = `${city} ${district} ${road} ${houseNo}`.trim();

      let building = "";
      if (data.namedetails && data.namedetails.name) {
        building = ` (${data.namedetails.name})`;
      }

      setAddress(baseAddr + building);
    } catch (e) {
      console.error("역지오코딩 실패:", e);
    }
  };

  // 주소 → 좌표 변환
  const searchAddress = async () => {
    try {
      let query = address.trim();
      let fullQuery = `서울특별시 동대문구 ${query}`;

      let res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullQuery)}&format=json&limit=1&addressdetails=1&namedetails=1`);
      let data = await res.json();

      if (data.length === 0) {
        // 실패하면 띄어쓰기 버전도 시도
        let fallback = query.replace(/로(\d+)길/g, "로 $1길").replace(/길(\d+)/g, "길 $1");
        fullQuery = `서울특별시 동대문구 ${fallback}`;

        res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullQuery)}&format=json&limit=1&addressdetails=1&namedetails=1`);
        data = await res.json();
      }


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

        console.log('📍 주소 검색으로 위치 설정:', { lat: coords[0], lng: coords[1] });
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

  // 페이지 로드 시 개인화된 메시지 가져오기
  useEffect(() => {
    fetchPersonalizedMessages();
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (showMap && mapDivRef.current) {
      if (!mapRef.current) {
        const mapInstance = L.map(mapDivRef.current, {
          center: [37.5839, 127.0559],
          zoom: 13,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(mapInstance);

        mapRef.current = mapInstance;

        mapInstance.on("click", async (e) => {
          const { lat, lng } = e.latlng;
          if (markerRef.current) {
            markerRef.current.setLatLng(e.latlng);
          } else {
            markerRef.current = L.marker(e.latlng).addTo(mapInstance);
          }
          
          // 디버깅: 위치 선택 확인
          console.log('📍 지도에서 위치 선택:', { lat, lng });
          
          setStartLocation({ lat, lng });
          await fetchAddress(lat, lng);
        });
        // ✅ 동대문구 윤곽선 추가
fetch("https://nominatim.openstreetmap.org/search.php?q=동대문구&polygon_geojson=1&format=json")
  .then((res) => res.json())
  .then((data) => {
    if (data.length > 0 && data[0].geojson) {
      // 기존 윤곽선 있으면 제거
      if (boundaryLayerRef.current) {
        mapInstance.removeLayer(boundaryLayerRef.current);
      }
      // 새 윤곽선 추가
      boundaryLayerRef.current = L.geoJSON(data[0].geojson, {
        style: {
          color: "blue",    // 선 색
          weight: 3,         // 선 두께
          fillColor: "#7cace7ff",
          fillOpacity:0.2,  
        },
      }).addTo(mapInstance);

      // 윤곽선 범위에 맞춰 지도 확대
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
              내 정보
            </button>
          ) : (
            <button style={styles.headerBtn} onClick={() => nav("/login")}>
              Google 로그인
            </button>
          )}
        </div>
      </div>

      {/* 배너 */}
      <div style={styles.bannerWrapper}>
        {/* 울퉁불퉁한 땅 라인 (선 하나) */}
        <svg viewBox="0 0 400 100" preserveAspectRatio="none" style={styles.groundLine}>
          <path
             d="
      M0,70
      Q20,65 40,70
      T80,70
      T120,70
      T160,70
      T200,70
      T240,70
      T280,70
      T320,70
      T360,70
      T400,70
    "
            stroke = "#E2BF7A"
            strokeWidth="4"
            fill="none"
          />
        </svg>

        {/* 아이콘들 (땅 위에 올림) */}
        <div style={styles.groundItems}>
          <img src="/assets/grass.png" alt="풀2" style={styles.grass2} />
          <img src="/assets/grass.png" alt="풀" style={styles.grass} />
          <img src="/assets/sign2.png" alt="이정표" style={styles.sign} />
          <div style={styles.banner}>
          <h2 style={styles.subtitle}>동대문구의 숨은 산책로를 찾아서</h2>
          <h1 style={styles.title}>숨길</h1>
          </div>
          <img src="/assets/tree.png" alt="나무" style={styles.tree} />
          <img src="/assets/bird2.png" alt="새" style={styles.bird} />
          
        </div>
        {/* 해 (우상단) */}
        <img src="/assets/sun.png" alt="해" style={styles.sun} />
      </div>


      {/* 버튼들 */}
      <div style={styles.buttons}>

        {/* 추가: 안내 문구 3줄 */}
        <div
  style={{
    marginTop: 0,
    marginBottom: 24,   // 아래 버튼과의 간격
    textAlign: "center",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    fontFamily: "MyCustomFont",
  }}
>
  {personalizedMessages.map((message, index) => {
    // 첫 번째 메시지(장소 기반)와 두 번째 메시지(시간대 기반) 클릭 가능하게 만들기
    const isFirstMessageClickable = index === 0 && message.includes("오늘은") && message.includes("에서 새로운 산책을 시작해보세요");
    const isSecondMessageClickable = index === 1 && (message.includes("긴 코스") || message.includes("짧은 코스") || message.includes("새로운"));
    
    const isClickable = isFirstMessageClickable || isSecondMessageClickable;
    
    // 추천된 장소 추출 (첫 번째 메시지용)
    const extractRecommendedPlace = (msg) => {
      const match = msg.match(/오늘은 (.+?)에서 새로운 산책을 시작해보세요/);
      return match ? match[1] : null;
    };
    
    // 시간대별 추천 장소 (두 번째 메시지용)
    const getDurationBasedPlace = () => {
      // 사용자 취향에 따른 추천 장소
      if (message.includes("긴 코스")) {
        return "한강공원"; // 긴 코스 추천
      } else if (message.includes("짧은 코스")) {
        return "어린이놀이터"; // 짧은 코스 추천
      } else {
        return "중랑천"; // 변주 코스 추천
      }
    };
    
    const recommendedPlace = isFirstMessageClickable ? extractRecommendedPlace(message) : getDurationBasedPlace();
    
    return (
      <p
        key={index}
        style={{
          fontSize: 23,
          margin: index === personalizedMessages.length - 1 ? 0 : "0 0 4px 0",
          textShadow: "0.2px 0 #000000ff, -0.2px 0 #000000ff, 0 0.2px #000000ff, 0 -0.2px #000000ff",
          cursor: isClickable ? "pointer" : "default",
          textDecoration: isClickable ? "underline" : "none",
          textDecorationThickness: isClickable ? "0.5px" : "auto",
          color: isClickable ? "#3a893e" : "inherit",
        }}
        onClick={() => {
          if (isClickable && recommendedPlace) {
            // 첫 번째 메시지는 RecommendationPage1, 두 번째 메시지는 RecommendationPage2로 이동
            const targetPage = isFirstMessageClickable ? "/recommendation1" : "/recommendation2";
            
            nav(targetPage, {
              state: {
                recommendedPlace,
                userPreference: getDurationPreference(), // 시간대별 선호도 분석
                currentLocation: startLocation || { lat: 37.5839, lng: 127.0559 }
              }
            });
          }
        }}
      >
        {message}
      </p>
    );
  })}
</div>

        {/* 추가 끝 */}

       {/* 시작 위치 선택 */}
<button style={styles.btn} onClick={() => setShowMap((prev) => !prev)}>
  {showMap ? <FaChevronDown size={14} style={{ marginRight: 6 }} /> 
           : <FaChevronRight size={14} style={{ marginRight: 6 }} />}
  시작 위치
</button>

        {showMap && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
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
                    // 검색 함수 호출
                  }
                }}
              />
              <button style={styles.searchBtn} onClick={searchAddress}>확인</button>
            </div>
            <div ref={mapDivRef} style={styles.map}></div>
          </div>
        )}

        {address && <p style={styles.text}>선택된 위치: {address}</p>}

       {/* 산책 시간 선택 */}
<button style={styles.btn} onClick={() => setShowDurationInput((prev) => !prev)}>
  {showDurationInput ? <FaChevronDown size={14} style={{ marginRight: 6 }} /> 
                     : <FaChevronRight size={14} style={{ marginRight: 6 }} />}
  산책 시간
</button>
        {showDurationInput && (
          <div style={{ marginTop: 10 }}>
            <input type="number" min="5" max="120" step="5" value={duration ?? ""} onChange={(e) => setDuration(Number(e.target.value))} style={styles.input} placeholder="5 ~ 120분" />
          </div>
        )}

       {/* 산책 무드 선택 */}
<button style={styles.btn} onClick={() => setShowMoodInput((prev) => !prev)}>
  {showMoodInput ? <FaChevronDown size={14} style={{ marginRight: 6 }} /> 
                 : <FaChevronRight size={14} style={{ marginRight: 6 }} />}
  산책 무드
</button>
      {showMoodInput && (
        <div style={{ marginTop: 10, width: "90%" }}>
          <div style={styles.moodOptions}>
            {[
              { value: "활기찬", emoji: "⚡", color: "#FF6B6B" },
              { value: "잔잔한", emoji: "🌊", color: "#4ECDC4" },
              { value: "상쾌한", emoji: "🌿", color: "#45B7D1" },
              { value: "몽환적", emoji: "✨", color: "#96CEB4" }
            ].map((option) => (
              <button
                key={option.value}
                style={{
                  ...styles.moodOption,
                  background: mood === option.value ? option.color : "#f0f0f0",
                  color: mood === option.value ? "#fff" : "#333",
                  border: mood === option.value ? `2px solid ${option.color}` : "2px solid #ddd"
                }}
                onClick={() => setMood(option.value)}
              >
                <span style={{ fontSize: "24px", marginRight: "8px" }}>{option.emoji}</span>
                {option.value}
              </button>
            ))}
          </div>
        </div>
      )}
        <button
          style={{
            ...styles.btn,
            background: canProceed ? "rgba(58,137,62,0.7)" : "#aaa",
            marginTop: 2,
            borderRadius: "999px",
            padding: "12px 24px",
            width: "auto",
            fontSize: 16,
          }}
          disabled={!canProceed}
          onClick={() => nav("/loading", { 
            state:{
              startLocation,
              duration,
              mood,
              address,
              },
            })
          }
        >
          다음으로 ➩
        </button>
        <button
        style={{
          ...styles.btn,
          marginTop: 40,
          padding: "12px 24px",
          width: "auto",
          fontSize: 22,
          background: "#e0a55eff",
        }}
        onClick={() => nav("/custom-walk")}
      >
        나만의 산책로 만들기
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
    marginBottom: -10,
  },
  headerBtn: {
    padding: "4px 10px",
    borderRadius: 6,
    border: "1px solid #ddd",
    background: "#fff",
    fontFamily: "MyCustomFont",
    fontSize: 20,
    cursor: "pointer",
  },

  /* 배너 */
  bannerWrapper: {
    position: "relative",
    width: "100%",
    textAlign: "center",
    marginBottom: 20,
  },
  sun: {
    position: "absolute",
    top: 0,
    left: 5,
    width: 60,
    zIndex: 1,
  },
  groundLine: {
    position: "absolute",
    bottom: -30,
    left:0,
    width: "100%",
    height: 100,
    zIndex: 0,
  },
  groundItems: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 20,
    marginTop: 20, // 글씨와 겹치지 않게 띄우기
    position: "relative",
  },
  bird: { width: 40, marginLeft: 0 },
  tree: { width: 80, marginRight: -20, marginLeft: -70, },
  sign: { width: 70, marginRight:-70, },
  grass: { width: 40, marginRight: -20, position: "relative",top: 6, },
  grass2: {width: 25, marginRight: -30,position: "relative",top:4,},
  banner:{
    display:"flex",
    flexDirection:"column",
    alignItems:"center",
    marginBottom: 20, // 숨길이랑 소개 텍스트 사이 간격
  },
  subtitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#70c273ff",
    textAlign: "center",
    marginBottom: -50,
    whiteSpace: "nowrap",
    fontFamily: "MyCustomFont",
    textShadow: "0.3px 0 #70c273, -0.3px 0 #70c273, 0 0.3px #70c273, 0 -0.3px #70c273",
  },
  title:{
    fontSize: 70,
    color:"#3a893eff",
    marginBottom: -10,
    fontFamily: "MyCustomFont",
    textShadow: "1px 0 #3a893e, -1px 0 #3a893e, 0 1px #3a893e, 0 -1px #3a893e",
  },

  /* 버튼 */
  buttons: { display: "flex", flexDirection: "column", gap: 16, alignItems: "center", marginTop: 40,},
  btn: {
    padding: "12px 20px",
    border: "none",
    borderRadius: 8,
    background: "rgba(58,137,62,0.7)",
    color: "#fff",
    fontSize: 20,
    cursor: "pointer",
    width: "60%",
    fontFamily: "MyCustomFont",
    textShadow: "0.3px 0 #fff, -0.3px 0 #fff, 0 0.3px #fff, 0 -0.3px #fff",
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
    background: "rgba(58,137,62,0.7)",
    color: "#fff",
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "MyCustomFont",
  },
  moodOptions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    width: "100%",
    maxWidth: "300px",
    margin: "0 auto",
  },
  moodOption: {
    padding: "8px 6px",
    borderRadius: "12px",
    border: "2px solid #ddd",
    background: "#f0f0f0",
    color: "#333",
    cursor: "pointer",
    fontSize: "18px",
    fontFamily: "MyCustomFont",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    textShadow: "0.2px 0 #fff, -0.2px 0 #fff, 0 0.2px #fff, 0 -0.2px #fff",
  },
  footerText: { marginTop: 8, fontSize: 14, color: "#888" },
};





