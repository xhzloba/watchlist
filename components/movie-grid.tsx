"use client";

import Link from "next/link";
import Image from "next/image";
import { getImageUrl, formatDate } from "@/lib/tmdb";
import type { Movie } from "@/lib/tmdb";
import { playSound } from "@/lib/sound-utils";
import { useEffect, useState } from "react";
import { safeGetItem } from "@/lib/storage-utils";

// Тип для размера постеров
export type PosterSize = "small" | "medium" | "large";

interface MovieGridProps {
  movies: Movie[];
  emptyMessage?: string;
  lastMovieRef?: (node: HTMLElement | null) => void;
  useDiscoverStyle?: boolean;
  posterSize?: PosterSize;
}

export default function MovieGrid({
  movies,
  emptyMessage = "Нет фильмов",
  lastMovieRef,
  useDiscoverStyle = false,
  posterSize = "medium",
}: MovieGridProps) {
  const [roundedCorners, setRoundedCorners] = useState(false);

  // Эффект для отслеживания настройки закругленных углов
  useEffect(() => {
    // Инициализация значения из localStorage
    const savedRoundedCorners = safeGetItem("settings_rounded_corners");
    setRoundedCorners(savedRoundedCorners === "true");

    // Обработчик изменения настроек
    const handleSettingsChange = (event: CustomEvent) => {
      if (event.detail?.roundedCorners !== undefined) {
        setRoundedCorners(event.detail.roundedCorners);
      }
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

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = "/placeholder.svg";
  };

  // Функция для получения классов сетки в зависимости от размера
  const getGridClasses = (size: PosterSize): string => {
    switch (size) {
      case "small": // Самый мелкий размер
        return "grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-9 2xl:grid-cols-10 gap-2";
      case "medium": // Средний размер
        return "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9 gap-3";
      case "large": // Большой размер
        return "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-5";
      default: // По умолчанию средний
        return "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9 gap-3";
    }
  };

  if (movies.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={getGridClasses(posterSize)}>
      {movies.map((movie, index) => (
        <Link
          key={`${movie.id}-${index}`}
          href={`/movie/${movie.id}`}
          className="group"
          ref={index === movies.length - 1 ? lastMovieRef : undefined}
          onClick={() => playSound("choose.mp3")}
        >
          <div
            className={`relative aspect-[2/3] ${
              roundedCorners ? "rounded-xl" : "rounded-lg"
            } overflow-hidden mb-2 border-[3px] border-transparent group-hover:border-white transition-all duration-300 shadow-lg`}
          >
            <Image
              src={getImageUrl(movie.poster_path, "w500") || "/placeholder.svg"}
              alt={movie.title || "Фильм"}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={handleImageError}
            />

            {/* Популярность (опционально для useDiscoverStyle) */}
            {useDiscoverStyle &&
              movie.popularity &&
              movie.popularity >= 1000 && (
                <div className="absolute bottom-0 right-0 z-10">
                  <div className="bg-gradient-to-tr from-red-600/90 to-red-600/30 backdrop-blur-sm text-white text-[9px] py-1 pl-3 pr-2 clip-path-polygon font-medium">
                    <div className="flex items-center gap-0.5">
                      <span className="text-white">ТРЕНД</span>
                      <span className="text-xs">🌶️</span>
                    </div>
                  </div>
                </div>
              )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <h3 className="text-sm font-medium text-white truncate">
            {movie.title || movie.name || "Без названия"}
          </h3>
          {movie.release_date && (
            <p className="text-xs text-gray-400">
              {formatDate(movie.release_date, true)}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}
