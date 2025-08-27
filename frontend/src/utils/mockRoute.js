// src/utils/mockRoute.js

// 목업 경로 생성 함수
export function buildMockRoute({ startLocation, duration }) {
  if (!startLocation) {
    // 기본 위치: 서울시청
    startLocation = { lat: 37.5665, lng: 126.9780 };
  }

  const { lat, lng } = startLocation;
  const step = Math.max(0.001, (duration || 30) * 0.0001);

  return [
    [lat, lng],
    [lat + step, lng + step],
    [lat + step * 2, lng],
    [lat, lng - step],
    [lat, lng],
  ];
}