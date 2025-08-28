import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { recommendRoute } from "../services/api.js";
import { buildMockRoute } from "../utils/mockRoute.js";

export default function LoadingPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { startLocation, duration, mood, address } = location.state || {};

  useEffect(() => {
    async function generateRoute() {
      try {
        // ✅ 실제 API 호출
        const data = await recommendRoute(
          startLocation.lat,
          startLocation.lng,
          duration
        );

        // 성공 시 ResultPage로 이동
        nav("/result", { state: { result: data, startLocation, duration, mood, address } });
      } catch (err) {
        console.error("경로 생성 실패:", err);
        alert("경로 생성에 실패했습니다. Mock 데이터를 사용합니다.");

        // ✅ 실패 시 Mock 데이터 생성
        const mockPath = buildMockRoute({ startLocation, duration });
        const mockResult = {
          geojson: { features: [{ geometry: { coordinates: mockPath } }] },
          description: [
            {
              path_name: "추천 경로",
              description: "완만한 보행로와 휴식 포인트를 고려해 추천된 산책 경로입니다.",
            },
          ],
        };

        nav("/result", { state: { result: mockResult, startLocation, duration, mood, address } });
      }
    }

    if (startLocation && duration) {
      generateRoute();
    } else {
      // 필요한 값이 없으면 SetupPage로 리다이렉트
      nav("/", { replace: true });
    }
  }, [nav, startLocation, duration, mood, address]);

  return (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",  // 세로 중앙
      alignItems: "center",      // 가로 중앙
      height: "100vh",           // 화면 전체 높이
      fontFamily: "MyCustomFont",
      textShadow: "0.3px 0 black, -0.3px 0 black, 0 0.3px black, 0 -0.3px black",
    }}
  >
    <p style={{ fontSize: "40px", marginTop: "-10px", marginBottom: "10px" }}>
      경로 생성중...
    </p>
    <img
      src="/assets/loading.gif"
      alt="loading"
      style={{
        width: "200px",   // 원하는 최대 너비
        height: "auto",   // 자동 비율 유지
      }}
    />
  </div>
);

}
