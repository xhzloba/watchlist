"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { getImageUrl, formatDate } from "@/lib/tmdb";
import { Star } from "lucide-react";
import MovieCardWrapper, {
  ReleaseQuality,
  useReleaseQualityVisibility,
} from "./movie-card-wrapper";
import { playSound } from "@/lib/sound-utils";

interface MovieCardProps {
  id: number;
  title: string;
  posterPath: string;
  releaseDate?: string;
  voteAverage?: number;
  releaseQuality?: ReleaseQuality;
}

// Добавим функцию проверки статуса в медиатеке напрямую из localStorage
const isMovieInWatchlist = (movieId: number): boolean => {
  if (typeof window === "undefined") return false;

  try {
    const watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
    return watchlist.some((item: any) => item.id === movieId);
  } catch (e) {
    console.error("Ошибка при проверке статуса в медиатеке:", e);
    return false;
  }
};

export default function MovieCard({
  id,
  title,
  posterPath,
  releaseDate,
  voteAverage,
  releaseQuality,
  onClick,
}: MovieCardProps & { onClick?: () => void }) {
  // Локальное состояние для отслеживания статуса в медиатеке
  const [inWatchlist, setInWatchlist] = useState(false);
  // Получаем настройки закругления из контекста
  const { roundedCorners } = useReleaseQualityVisibility();

  // Функция для проверки статуса
  const checkWatchlistStatus = useCallback(() => {
    const status = isMovieInWatchlist(id);
    setInWatchlist(status);
  }, [id]);

  // При монтировании и изменениях
  useEffect(() => {
    checkWatchlistStatus();

    // События для синхронизации
    const handleWatchlistChange = () => {
      checkWatchlistStatus();
    };

    window.addEventListener("storage", handleWatchlistChange);
    document.addEventListener("watchlistChange", handleWatchlistChange);
    window.addEventListener("popstate", handleWatchlistChange);
    window.addEventListener("focus", handleWatchlistChange);

    // Уменьшим частоту проверок до разумного значения
    const interval = setInterval(checkWatchlistStatus, 1000);

    return () => {
      window.removeEventListener("storage", handleWatchlistChange);
      document.removeEventListener("watchlistChange", handleWatchlistChange);
      window.removeEventListener("popstate", handleWatchlistChange);
      window.removeEventListener("focus", handleWatchlistChange);
      clearInterval(interval);
    };
  }, [checkWatchlistStatus, id]);

  const handleClick = (e: React.MouseEvent) => {
    playSound("choose.mp3");
    if (onClick) onClick();
  };

  return (
    <div onClick={handleClick}>
      <MovieCardWrapper
        releaseQuality={releaseQuality}
        rating={voteAverage}
        className={`group relative overflow-hidden ${
          roundedCorners ? "rounded-xl" : "rounded-lg"
        } bg-black/20 h-full transition-transform duration-300 hover:scale-105`}
      >
        {/* Индикатор медиатеки - всегда проверяем текущий статус */}
        {inWatchlist && (
          <div
            className="absolute top-2 right-2 z-10 w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center"
            style={{
              display: window.location.pathname.includes("/watchlist")
                ? "none"
                : "flex",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-black"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
            </svg>
          </div>
        )}
        <div className={`relative aspect-[2/3] w-full`}>
          <Image
            src={getImageUrl(posterPath, "w500")}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover"
            priority={false}
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
          <h3 className="text-sm font-medium text-white line-clamp-2">
            {title}
          </h3>
          <div className="flex items-center justify-between mt-1">
            {releaseDate && (
              <span className="text-xs text-gray-300">
                {new Date(releaseDate).getFullYear()}
              </span>
            )}
            {voteAverage !== undefined && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-xs text-gray-300">
                  {voteAverage.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      </MovieCardWrapper>
    </div>
  );
}
