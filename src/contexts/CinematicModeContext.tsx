import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface CinematicModeContextValue {
  isCinematic: boolean;
  toggleCinematic: () => void;
}

const CinematicModeContext = createContext<CinematicModeContextValue>({
  isCinematic: false,
  toggleCinematic: () => {},
});

export function CinematicModeProvider({ children }: { children: ReactNode }) {
  const [isCinematic, setIsCinematic] = useState(() => {
    try {
      return localStorage.getItem("trenchclaw-cinematic") === "true";
    } catch {
      return false;
    }
  });

  const toggleCinematic = useCallback(() => {
    setIsCinematic((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("trenchclaw-cinematic", String(next));
      } catch {}
      return next;
    });
  }, []);

  return (
    <CinematicModeContext.Provider value={{ isCinematic, toggleCinematic }}>
      {children}
    </CinematicModeContext.Provider>
  );
}

export function useCinematicMode() {
  return useContext(CinematicModeContext);
}
