// src/utils/routeHistory.js
const KEY = "route_history_v1";

export function getRouteHistory()
{
  try {
    const raw = localStorage.getItem(KEY);
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
  localStorage.setItem(KEY, JSON.stringify(list));
}
