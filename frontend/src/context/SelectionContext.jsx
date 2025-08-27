import { createContext, useContext, useMemo, useState, useEffect } from "react";

const SelectionContext = createContext(null);
const KEY = "soomgil.selection";

export function SelectionProvider({ children }) {
  // 시작 위치 좌표 {lat, lng}
  const [startLocation, setStartLocation] = useState(null);

  // 소요 시간 (분) → 최소 5 이상
  const [duration, setDuration] = useState(null);

  // 초기 로컬스토리지 복구
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === "object") {
          setStartLocation(saved.startLocation ?? null);
          setDuration(saved.duration ?? null);
        }
      }
    } catch (e) {
      console.warn("[SelectionContext] restore failed:", e);
    }
  }, []);

  // 값이 바뀔 때마다 로컬스토리지 저장
  useEffect(() => {
    try {
      const data = { startLocation, duration };
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("[SelectionContext] persist failed:", e);
    }
  }, [startLocation, duration]);

  // 버튼 활성화 조건 → 시작위치 있고, duration ≥ 5
  const canProceed = Boolean(startLocation && duration >= 5);

  // Context value
  const value = useMemo(
    () => ({
      startLocation, setStartLocation,
      duration, setDuration,
      canProceed,
    }),
    [startLocation, duration, canProceed]
  );

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

// 훅
export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection must be used within SelectionProvider");
  return ctx;
}
