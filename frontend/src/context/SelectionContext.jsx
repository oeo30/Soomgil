import { createContext, useContext, useMemo, useState, useEffect } from "react";

const SelectionContext = createContext(null);
const KEY = "soomgil.selection";

export function SelectionProvider({ children }) {
  const [season, setSeason] = useState(null);
  const [length, setLength] = useState(null);
  const [structure, setStructure] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === "object") {
          setSeason(saved.season ?? null);
          setLength(saved.length ?? null);
          setStructure(saved.structure ?? null);
        }
      }
    } catch (e) {
      console.warn("[SelectionContext] restore failed:", e);
    }
  }, []);

  useEffect(() => {
    try {
      const data = { season, length, structure };
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("[SelectionContext] persist failed:", e);
    }
  }, [season, length, structure]);

  const canProceed = Boolean(season && length && structure);

  const value = useMemo(
    () => ({
      season, setSeason,
      length, setLength,
      structure, setStructure,
      canProceed,
    }),
    [season, length, structure, canProceed]
  );

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection must be used within SelectionProvider");
  return ctx;
}
