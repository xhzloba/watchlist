"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface ColorContextType {
  colors: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
  };
  setMovieColors: (colors: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
  }) => void;
  resetToBaseColors: () => void;
  isTransitioning: boolean;
}

// Используем значения из CSS-переменных
const baseColors = {
  topLeft: "var(--color-ultrablur-tl)",
  topRight: "var(--color-ultrablur-tr)",
  bottomLeft: "var(--color-ultrablur-bl)",
  bottomRight: "var(--color-ultrablur-br)",
};

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export function ColorProvider({ children }: { children: React.ReactNode }) {
  const [colors, setColors] = useState(baseColors);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const setMovieColors = useCallback((newColors: typeof colors) => {
    setIsTransitioning(true);
    setColors(newColors);

    setTimeout(() => {
      setIsTransitioning(false);
    }, 1500);
  }, []);

  const resetToBaseColors = useCallback(() => {
    // Используем CSS-переменные при сбросе
    setColors(baseColors);
    setIsTransitioning(false);
  }, []);

  return (
    <ColorContext.Provider
      value={{
        colors,
        setMovieColors,
        resetToBaseColors,
        isTransitioning,
      }}
    >
      {children}
    </ColorContext.Provider>
  );
}

export function useColorContext() {
  const context = useContext(ColorContext);
  if (context === undefined) {
    throw new Error("useColorContext must be used within a ColorProvider");
  }
  return context;
}
