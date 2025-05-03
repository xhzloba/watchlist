"use client";

import { useEffect, useState, memo, createContext, useContext } from "react";
import { safeGetItem } from "@/lib/storage-utils";

// Создаем глобальный контекст для настройки качества релиза
const ReleaseQualityContext = createContext({
  showReleaseQuality: true,
  showMovieRating: true,
  showTitles: true,
  roundedCorners: false,
  yellowHover: false,
  initialized: false,
});

// Провайдер для глобальной настройки
export function ReleaseQualityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState({
    showReleaseQuality: true,
    showMovieRating: true,
    showTitles: true,
    roundedCorners: false,
    yellowHover: false,
    initialized: false,
  });

  useEffect(() => {
    // Загрузка настроек только один раз при монтировании
    const savedQuality = safeGetItem("settings_show_release_quality");
    const savedRating = safeGetItem("settings_show_movie_rating");
    const savedRoundedCorners = safeGetItem("settings_rounded_corners");
    const savedShowTitles = safeGetItem("settings_show_titles");
    const savedYellowHover = safeGetItem("settings_yellow_hover");

    setSettings({
      showReleaseQuality: savedQuality ? savedQuality === "true" : true,
      showMovieRating: savedRating ? savedRating === "true" : true,
      showTitles: savedShowTitles ? savedShowTitles === "true" : true,
      roundedCorners: savedRoundedCorners
        ? savedRoundedCorners === "true"
        : false,
      yellowHover: savedYellowHover ? savedYellowHover === "true" : false,
      initialized: true,
    });

    // Обработчик изменения настроек
    const handleSettingsChange = (event: CustomEvent) => {
      const {
        showReleaseQuality,
        showMovieRating,
        roundedCorners,
        showTitles,
        yellowHover,
      } = event.detail;
      setSettings((prev) => ({
        ...prev,
        showReleaseQuality:
          showReleaseQuality !== undefined
            ? showReleaseQuality
            : prev.showReleaseQuality,
        showMovieRating:
          showMovieRating !== undefined
            ? showMovieRating
            : prev.showMovieRating,
        showTitles: showTitles !== undefined ? showTitles : prev.showTitles,
        roundedCorners:
          roundedCorners !== undefined ? roundedCorners : prev.roundedCorners,
        yellowHover: yellowHover !== undefined ? yellowHover : prev.yellowHover,
      }));
    };

    document.addEventListener(
      "settingsChange",
      handleSettingsChange as EventListener
    );

    return () => {
      document.removeEventListener(
        "settingsChange",
        handleSettingsChange as EventListener
      );
    };
  }, []);

  return (
    <ReleaseQualityContext.Provider value={settings}>
      {children}
    </ReleaseQualityContext.Provider>
  );
}

// Хук для доступа к настройкам отображения качества
export function useReleaseQualityVisibility() {
  return useContext(ReleaseQualityContext);
}

// Интерфейс для качества релиза
export interface ReleaseQuality {
  type: "HD" | "4K" | "HDR" | string;
  color?: string;
}

interface MovieCardWrapperProps {
  children: React.ReactNode;
  releaseQuality?: ReleaseQuality;
  rating?: number;
  className?: string;
}

// Оптимизированный компонент-обертка с мемоизацией
const MovieCardWrapper = memo(function MovieCardWrapper({
  children,
  releaseQuality,
  rating,
  className = "",
}: MovieCardWrapperProps) {
  const {
    showReleaseQuality,
    showMovieRating,
    showTitles,
    roundedCorners,
    initialized,
  } = useReleaseQualityVisibility();

  return (
    <div className={`relative ${className}`}>
      {/* Заменяем вложенный div на элемент с правильными классами, чтобы закругление применялось ко всему контенту */}
      <div
        className={`${
          roundedCorners ? "rounded-xl" : "rounded-md"
        } overflow-hidden`}
      >
        {children}
      </div>

      {/* Бейдж качества релиза */}
      {initialized && showReleaseQuality && releaseQuality && (
        <div className="absolute top-2 right-2 z-10">
          <span className="px-2 py-1 bg-gray-200 text-black text-xs font-bold rounded-md">
            {releaseQuality.type}
          </span>
        </div>
      )}

      {/* Бейдж рейтинга фильма */}
      {initialized && showMovieRating && rating !== undefined && (
        <div
          className={`absolute top-2 left-2 ${
            rating >= 7.0
              ? "bg-green-600" // Хороший рейтинг - зеленый
              : rating >= 5.5
              ? "bg-gray-600" // Средний рейтинг - серый
              : "bg-red-600" // Низкий рейтинг - красный
          } text-white text-xs font-bold px-2 py-1 rounded-md`}
          style={{ willChange: "transform" }}
        >
          {rating.toFixed(1)}
        </div>
      )}
    </div>
  );
});

export default MovieCardWrapper;
