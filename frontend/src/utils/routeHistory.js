// src/utils/routeHistory.js
const KEY = "route_history_v1";

// 기존 localStorage 데이터를 세션 스토리지로 마이그레이션
function migrateFromLocalStorage() {
  try {
    const oldData = localStorage.getItem(KEY);
    if (oldData) {
      // 기존 localStorage 데이터를 세션 스토리지로 복사
      sessionStorage.setItem(KEY, oldData);
      // 기존 localStorage 데이터 삭제
      localStorage.removeItem(KEY);
      console.log("기존 localStorage 데이터를 세션 스토리지로 마이그레이션 완료");
    }
  } catch (error) {
    console.error("마이그레이션 중 오류:", error);
  }
}

export function getRouteHistory()
{
  // 마이그레이션 실행
  migrateFromLocalStorage();
  
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRouteHistory(entry)
{
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10); // 'YYYY-MM-DD'

  const safe = {
    date: ymd,
    startAddress: entry.startAddress ?? "미지정",
    durationMin: entry.durationMin ?? null,
    title: entry.title ?? "경로",
    summary: entry.summary ?? "",
  };

  const list = getRouteHistory();
  list.unshift(safe);                 // 최근 것이 위로 오도록
  sessionStorage.setItem(KEY, JSON.stringify(list));
}

// 세션 스토리지 초기화 함수 (테스트용)
export function clearRouteHistory() {
  sessionStorage.removeItem(KEY);
  localStorage.removeItem(KEY);
}
