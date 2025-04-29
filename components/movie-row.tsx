"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Grid,
  Play,
  ChevronRightCircle,
} from "lucide-react";
import type { Movie } from "@/lib/tmdb";
import { getImageUrl, getYear, formatDate, getMovieLogos } from "@/lib/tmdb";
import TrailerModal from "./trailer-modal";
import { playSound } from "@/lib/sound-utils";

interface MovieRowProps {
  title: string;
  items: Movie[];
  variant?: "poster" | "backdrop";
  showDate?: boolean;
  showYear?: boolean;
  showLogo?: boolean;
  isTrailerSection?: boolean;
  className?: string;
  emptyMessage?: string;
  keywordIds?: number[];
  hideTitle?: boolean;
  backdropStyle?: boolean;
  onMovieClick?: () => void;
  posterSize?: "normal" | "large" | "small";
  backdropSize?: "normal" | "large" | "small";
  actorImage?: string;
  gap?: string;
  titleIcon?: React.ReactNode;
  disableNavigation?: boolean;
  shadow?: boolean;
}

// Простой хук для отслеживания ширины окна
function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => setWidth(window.innerWidth);

    // Устанавливаем начальную ширину на клиенте
    setWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return width;
}

export default function MovieRow({
  title,
  items,
  variant = "poster",
  showDate = false,
  showYear = false,
  showLogo = false,
  isTrailerSection = false,
  className = "",
  emptyMessage = "Нет доступных фильмов",
  keywordIds,
  hideTitle = false,
  onMovieClick,
  posterSize = "normal",
  backdropSize = "normal",
  actorImage,
  gap,
  titleIcon,
  disableNavigation = false,
  shadow = false,
}: MovieRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [roundedCorners, setRoundedCorners] = useState(false);
  const router = useRouter();
  const windowWidth = useWindowWidth(); // Получаем ширину окна

  // Эффект для отслеживания настройки закругленных углов
  useEffect(() => {
    // Инициализация значения из localStorage
    if (typeof window !== "undefined") {
      const savedRoundedCorners = localStorage.getItem(
        "settings_rounded_corners"
      );
      setRoundedCorners(savedRoundedCorners === "true");
    }

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

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === "left" ? -400 : 400;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const handleShowAll = () => {
    if (keywordIds && keywordIds.length > 0) {
      const route = `/keywords/${keywordIds.join(",")}`;
      if (title) {
        router.push(
          `${route}?description=${encodeURIComponent(
            title === "Фильмы про самолёты и авиацию"
              ? "Захватывающие истории о полётах, пилотах и авиакатастрофах"
              : ""
          )}`
        );
      } else {
        router.push(route);
      }
    }
  };

  // Определяем размер постера/бэкдропа в зависимости от пропов и ширины окна
  const getPosterWidth = () => {
    const isMobile = windowWidth < 768; // md breakpoint

    if (variant === "backdrop") {
      // Если мобильное разрешение, принудительно ставим small
      if (isMobile) {
        return "w-[260px]"; // Класс для backdropSize="small"
      }
      // На десктопе используем проп backdropSize
      switch (backdropSize) {
        case "large":
          return "w-[400px]";
        case "small":
          return "w-[260px]";
        default:
          return "w-[320px]"; // normal
      }
    }

    // Логика для poster (остается прежней)
    if (isMobile) {
      return "w-[160px]"; // Принудительно малый размер на мобильных
    }

    // На десктопе используем проп posterSize
    switch (posterSize) {
      case "large":
        return "w-[230px]";
      case "small":
        return "w-[160px]";
      default:
        return "w-[200px]"; // normal
    }
  };

  if (items.length === 0) {
    return (
      <div className={`px-6 py-8 ${className}`}>
        {title && <h2 className="text-xl font-medium mb-4">{title}</h2>}
        <p className="text-gray-400 text-center py-10">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <section className="relative">
      {!hideTitle && (
        <div className="px-6 mb-4">
          <div className="flex flex-col">
            <div className="flex items-center">
              {titleIcon && <div className="mr-3">{titleIcon}</div>}
              {actorImage && (
                <img
                  src={actorImage}
                  alt="Actor"
                  className="w-10 h-10 rounded-full mr-3 object-cover border-2 border-yellow-500"
                />
              )}
              <h2 className="text-xl uppercase tracking-wide font-bebas-neue pb-2 pr-8 relative border-b border-transparent">
                {title}
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent"></div>
              </h2>
              {keywordIds && keywordIds.length > 0 && (
                <ChevronRightCircle
                  className="ml-2 w-6 h-6 text-yellow-500 cursor-pointer hover:text-yellow-400 transition-colors self-start mt-1"
                  onClick={handleShowAll}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="group relative">
        <div
          ref={scrollRef}
          className={`flex ${
            gap ? gap : ""
          } overflow-x-auto scrollbar-hide scroll-smooth px-6 py-2 relative overflow-x-auto movie-row`}
        >
          {items.map((item, index) => (
            <div
              key={`movie-${item.id || index}-${index}`}
              className={`flex-none ${
                variant === "poster" ? getPosterWidth() : getPosterWidth()
              } p-1`}
            >
              {isTrailerSection ? (
                <button
                  onClick={() => {
                    if (onMovieClick) onMovieClick();
                    else playSound("choose.mp3");
                    setSelectedMovie(item);
                  }}
                  className="w-full"
                >
                  <MovieCard
                    item={item}
                    variant={variant}
                    showDate={showDate}
                    showYear={showYear}
                    showLogo={showLogo}
                    shadow={shadow}
                  />
                </button>
              ) : disableNavigation ? (
                <div
                  className="w-full cursor-pointer"
                  onClick={() => {
                    if (onMovieClick) onMovieClick();
                    else playSound("choose.mp3");
                  }}
                >
                  <MovieCard
                    item={item}
                    variant={variant}
                    showDate={showDate}
                    showYear={showYear}
                    showLogo={showLogo}
                    shadow={shadow}
                  />
                </div>
              ) : (
                <Link
                  href={`/movie/${item.id}`}
                  onClick={() => {
                    if (onMovieClick) onMovieClick();
                    else playSound("choose.mp3");
                  }}
                >
                  <MovieCard
                    item={item}
                    variant={variant}
                    showDate={showDate}
                    showYear={showYear}
                    showLogo={showLogo}
                    shadow={shadow}
                  />
                </Link>
              )}
            </div>
          ))}

          <button
            onClick={handleShowAll}
            className={`flex-none ${
              variant === "poster" ? getPosterWidth() : getPosterWidth()
            } ${variant === "poster" ? "aspect-[2/3]" : "aspect-video"} ${
              roundedCorners ? "rounded-xl" : "rounded-md"
            } bg-gray-800/50 flex flex-col items-center justify-center gap-2 hover:bg-gray-800 transition-colors`}
          >
            <Grid className="w-8 h-8" />
            <span className="text-sm font-medium">Показать все</span>
          </button>
        </div>

        <button
          onClick={() => scroll("left")}
          className="absolute top-1/2 -translate-y-1/2 left-2 z-10 p-2 rounded-full 
                     bg-yellow-400 hover:bg-yellow-500 text-black 
                     transition-all duration-300 disabled:opacity-0 disabled:cursor-not-allowed 
                     opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute top-1/2 -translate-y-1/2 right-2 z-10 p-2 rounded-full 
                     bg-yellow-400 hover:bg-yellow-500 text-black 
                     transition-all duration-300 disabled:opacity-0 disabled:cursor-not-allowed 
                     opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {selectedMovie && isTrailerSection && (
        <TrailerModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </section>
  );
}

function MovieCard({
  item,
  variant,
  showDate,
  showYear,
  showLogo,
  shadow,
}: {
  item: Movie;
  variant: "poster" | "backdrop";
  showDate: boolean;
  showYear: boolean;
  showLogo?: boolean;
  shadow: boolean;
}) {
  const [roundedCorners, setRoundedCorners] = useState(false);
  const [yellowHover, setYellowHover] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [loadingLogo, setLoadingLogo] = useState(false);

  // Эффект для загрузки логотипа если showLogo=true и variant=backdrop
  useEffect(() => {
    async function fetchLogo() {
      if (variant === "backdrop" && showLogo && item.id) {
        try {
          setLoadingLogo(true);
          const data = await getMovieLogos(item.id);
          if (data.logos && data.logos.length > 0) {
            setLogoPath(data.logos[0].file_path);
          }
        } catch (error) {
          console.error("Ошибка при загрузке логотипа:", error);
        } finally {
          setLoadingLogo(false);
        }
      }
    }

    fetchLogo();
  }, [variant, showLogo, item.id]);

  // Эффект для отслеживания настройки закругленных углов и цвета обводки
  useEffect(() => {
    // Инициализация значения из localStorage
    if (typeof window !== "undefined") {
      const savedRoundedCorners = localStorage.getItem(
        "settings_rounded_corners"
      );
      setRoundedCorners(savedRoundedCorners === "true");

      const savedYellowHover = localStorage.getItem("settings_yellow_hover");
      setYellowHover(savedYellowHover === "true");
    }

    // Обработчик изменения настроек
    const handleSettingsChange = (event: CustomEvent) => {
      if (event.detail?.roundedCorners !== undefined) {
        setRoundedCorners(event.detail.roundedCorners);
      }
      if (event.detail?.yellowHover !== undefined) {
        setYellowHover(event.detail.yellowHover);
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

  return (
    <div>
      <div
        className={`relative ${
          roundedCorners ? "rounded-xl" : "rounded-md"
        } overflow-hidden mb-2 ${
          variant === "poster" ? "aspect-[2/3]" : "aspect-video"
        } transition-all duration-200 border-[3px] ${
          isHovered
            ? yellowHover
              ? "border-yellow-500"
              : "border-white"
            : "border-transparent"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          ...(variant === "backdrop" && shadow
            ? { filter: "drop-shadow(2px 0px 6px black)" }
            : {}),
        }}
      >
        {(variant === "poster" && item.poster_path) ||
        (variant === "backdrop" && item.backdrop_path) ? (
          <Image
            src={getImageUrl(
              variant === "poster"
                ? item.poster_path || ""
                : item.backdrop_path || "",
              variant === "poster" ? "w500" : "w780"
            )}
            alt={item.title || item.name || ""}
            fill
            className={`object-cover transition-transform duration-300 ${
              isHovered ? "scale-105" : ""
            }`}
          />
        ) : (
          // Заглушка для фильмов без постера/бэкдропа
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 text-gray-400">
            <div className="text-center p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-10 h-10 mx-auto mb-2"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              <div className="text-xs font-medium mt-1">Нет изображения</div>
              {!item.release_date && (
                <div className="text-xs text-yellow-500 mt-1">В разработке</div>
              )}
            </div>
          </div>
        )}
        {variant === "backdrop" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
            <Play className="w-12 h-12 text-white" />
          </div>
        )}

        {/* Логотип фильма внизу по центру для backdrop варианта */}
        {variant === "backdrop" && showLogo && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none z-10">
            {logoPath ? (
              <div className="px-2 py-1">
                <img
                  src={getImageUrl(logoPath, "w300")}
                  alt={item.title || item.name || ""}
                  className="h-8 max-w-[200px] object-contain"
                  style={{
                    filter: "drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.7))",
                  }}
                />
              </div>
            ) : (
              <div className="bg-black/50 px-3 py-1 rounded-lg text-xs font-medium text-white">
                {item.title || item.name}
              </div>
            )}
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium truncate">
        {item.title || item.name}
      </h3>
      <p className="text-xs text-gray-400">
        {!item.release_date && !item.first_air_date
          ? item.status === "Post Production"
            ? "В производстве"
            : "В разработке"
          : showDate
          ? formatDate(item.release_date || item.first_air_date, showYear)
          : getYear(item.release_date || item.first_air_date)}
      </p>
    </div>
  );
}
