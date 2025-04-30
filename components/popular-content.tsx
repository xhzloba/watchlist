"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getImageUrl,
  type Movie as LocalMovieType,
  getPopularMoviesOnly,
} from "@/lib/tmdb";
import { ensurePlainMovieObject } from "@/lib/movie-utils";
import { playSound } from "@/lib/sound-utils";
import { useReleaseQualityVisibility } from "@/components/movie-card-wrapper";
import { getYear } from "@/lib/tmdb"; // Убедимся, что getYear импортирован

// Типы для размера и отступов
type PosterSize = "small" | "medium" | "large";
type GapSize = "m" | "l" | "xl";

export default function PopularContent() {
  const [movies, setMovies] = useState<LocalMovieType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRestoringState, setIsRestoringState] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [posterSize, setPosterSize] = useState<PosterSize>("medium");
  const [gapSize, setGapSize] = useState<GapSize>("m");
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Логика для слайдера размера
  const sizeMap: PosterSize[] = ["small", "medium", "large"];
  const sizeLabels: { [key in PosterSize]: string } = {
    small: "Маленький",
    medium: "Средний",
    large: "Большой",
  };
  const sliderValue = sizeMap.indexOf(posterSize);

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(event.target.value, 10);
    const newSize = sizeMap[newValue];
    if (newSize) {
      handleSizeChange(newSize);
    }
  };

  // Получаем и устанавливаем параметры из URL
  useEffect(() => {
    const size = searchParams.get("size");
    if (size && ["small", "medium", "large"].includes(size)) {
      setPosterSize(size as PosterSize);
    }
    const gap = searchParams.get("gap");
    if (gap && ["m", "l", "xl"].includes(gap)) {
      setGapSize(gap as GapSize);
    }
    setIsRestoringState(false);
  }, [searchParams]);

  // Ref для IntersectionObserver
  const observer = useRef<IntersectionObserver | null>(null);
  const lastMovieElementRef = useCallback(
    (node: Element | null) => {
      if (isLoadingMore || isRestoringState) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });

      if (node) observer.current?.observe(node);
    },
    [isLoadingMore, hasMore, isRestoringState]
  );

  // Функция загрузки фильмов
  const fetchPopularMovies = useCallback(
    async (pageNum: number) => {
      if (pageNum === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);
      try {
        const data = await getPopularMoviesOnly(pageNum);
        const newMovies = data.items.map(ensurePlainMovieObject);
        setMovies((prevMovies) =>
          pageNum === 1 ? newMovies : [...prevMovies, ...newMovies]
        );
        setHasMore(pageNum < data.totalPages);
      } catch (err: any) {
        console.error("[Popular Page] Ошибка загрузки фильмов:", err);
        setError(
          err.message || "Произошла ошибка при загрузке популярных фильмов."
        );
        setHasMore(false);
      } finally {
        if (pageNum === 1) setIsLoading(false);
        else setIsLoadingMore(false);
        if (isRestoringState) setIsRestoringState(false);
      }
    },
    [isRestoringState]
  );

  // Загрузка фильмов
  useEffect(() => {
    if (isRestoringState) return;
    fetchPopularMovies(page);
  }, [page, fetchPopularMovies, isRestoringState]);

  // Функции обновления URL
  const updateUrlParams = (newParams: Record<string, string>) => {
    const current = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      current.set(key, value);
    });
    router.push(`${pathname}?${current.toString()}`, { scroll: false });
    playSound("settings.mp3");
  };

  const handleSizeChange = (newSize: PosterSize) => {
    setPosterSize(newSize);
    updateUrlParams({ size: newSize });
  };

  const handleGapChange = (newGap: GapSize) => {
    setGapSize(newGap);
    updateUrlParams({ gap: newGap });
  };

  // Функция для классов сетки
  const getGridClasses = (size: PosterSize, gap: GapSize): string => {
    const sizeClasses = {
      small:
        "grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-9 2xl:grid-cols-10",
      medium:
        "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9",
      large:
        "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7",
    };
    const rowGapClasses = {
      m: "gap-y-3 md:gap-y-4",
      l: "gap-y-4 md:gap-y-8",
      xl: "gap-y-8 md:gap-y-24",
    };
    const fixedColGapClass = "gap-x-4";
    return `grid ${sizeClasses[size]} ${rowGapClasses[gap]} ${fixedColGapClass}`;
  };

  // Компонент MovieCard (теперь внутри PopularContent)
  const MovieCard = ({
    movie,
    index,
    isLastElement,
  }: {
    movie: LocalMovieType;
    index: number;
    isLastElement: boolean;
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [roundedCorners, setRoundedCorners] = useState(false);
    const [yellowHover, setYellowHover] = useState(false);
    const { showReleaseQuality } = useReleaseQualityVisibility();

    useEffect(() => {
      if (typeof window !== "undefined") {
        const savedRoundedCorners = localStorage.getItem(
          "settings_rounded_corners"
        );
        setRoundedCorners(savedRoundedCorners === "true");
        const savedYellowHover = localStorage.getItem("settings_yellow_hover");
        setYellowHover(savedYellowHover === "true");
      }
      const handleSettingsChange = (event: CustomEvent) => {
        if (event.detail?.roundedCorners !== undefined)
          setRoundedCorners(event.detail.roundedCorners);
        if (event.detail?.yellowHover !== undefined)
          setYellowHover(event.detail.yellowHover);
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

    const imageUrl = movie.poster_path
      ? getImageUrl(movie.poster_path, "w500")
      : "/placeholder.svg?height=300&width=200";

    return (
      <div>
        <Link
          href={`/movie/${movie.id}`}
          className={`movie-card block relative overflow-hidden group ${
            roundedCorners ? "rounded-xl" : "rounded-md"
          } border-2 ${
            isHovered
              ? yellowHover
                ? "border-yellow-500"
                : "border-white"
              : "border-transparent"
          } transition-all duration-200 mb-2`}
          ref={isLastElement ? lastMovieElementRef : null}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => playSound("choose.mp3")}
          style={{ aspectRatio: "2/3" }}
        >
          <Image
            src={imageUrl}
            alt={movie.title || "Постер фильма"}
            fill
            className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
            loading={index < 10 ? "eager" : "lazy"}
          />
          {showReleaseQuality && movie.releaseQuality && (
            <div className="absolute top-1.5 right-1.5 z-10">
              <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-[10px] font-bold rounded-lg shadow-lg">
                {movie.releaseQuality ||
                  (typeof movie.release_quality === "object"
                    ? movie.release_quality?.type
                    : movie.release_quality)}
              </span>
            </div>
          )}
        </Link>
        <h3 className="text-sm font-medium truncate px-1">
          {movie.title || movie.name}
        </h3>
        <p className="text-xs text-gray-400 px-1">
          {movie.release_date
            ? getYear(movie.release_date)
            : movie.first_air_date
            ? getYear(movie.first_air_date)
            : movie.status === "Post Production"
            ? "В производстве"
            : "В разработке"}
        </p>
      </div>
    );
  };

  // --- Рендеринг PopularContent ---
  // Убираем эту проверку, так как шапка должна рендериться всегда
  /*
  if (isLoading && page === 1) {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#121212] z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
        </div>
    );
  }
  */

  // Сообщение об ошибке показываем так же, заменяя весь контент
  if (error && movies.length === 0 && !isLoading) {
    // Добавляем !isLoading, чтобы не показывать одновременно с лоадером сетки
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center px-4 pt-24">
        <h1 className="text-2xl font-semibold mb-4">
          Упс! Что-то пошло не так
        </h1>
        <p className="text-red-500 mb-6">{error}</p>
        <button
          onClick={() => fetchPopularMovies(1)}
          className="px-6 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 transition-colors font-medium"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  // Основной рендер компонента
  return (
    <div ref={scrollContainerRef} className="pt-24 pb-10 px-4 md:px-6 lg:px-8">
      {/* Шапка с заголовком и контролами - рендерится всегда */}
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bebas-neue tracking-wide text-yellow-400 uppercase">
          Популярное на Watchlist
        </h1>
        <div className="flex items-center space-x-4 md:space-x-6">
          {/* Вертикальный промежуток */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400">
              Вертикальный промежуток:
            </span>
            <div className="flex gap-1">
              {(["m", "l", "xl"] as GapSize[]).map((gap) => (
                <button
                  key={gap}
                  onClick={() => handleGapChange(gap)}
                  className={`px-3 py-1 text-xs rounded-md transition-all font-medium ${
                    gapSize === gap
                      ? "bg-yellow-500 text-black"
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  }`}
                >
                  {gap.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          {/* Размер (Слайдер) */}
          <div className="flex items-center gap-3 flex-shrink-0 w-[80px] md:w-48">
            <label
              htmlFor="poster-size-slider"
              className="hidden md:inline text-xs text-gray-400 whitespace-nowrap"
            >
              Размер:
            </label>
            <input
              id="poster-size-slider"
              type="range"
              min="0"
              max="2"
              step="1"
              value={sliderValue}
              onChange={handleSliderChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              title={`Размер постеров: ${sizeLabels[posterSize]}`}
            />
            <span className="hidden md:inline text-xs font-medium text-gray-300 w-14 text-right">
              {sizeLabels[posterSize]}
            </span>
          </div>
        </div>
      </div>

      {/* Условный рендеринг: Лоадер ИЛИ Сетка */}
      {isLoading && page === 1 ? (
        // Показываем лоадер только в области сетки
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-yellow-500"></div>
        </div>
      ) : movies.length === 0 && !error ? (
        // Сообщение, если фильмы не найдены (и нет ошибки, и не идет загрузка)
        <p className="text-center text-gray-400 py-20">
          Популярные фильмы не найдены.
        </p>
      ) : (
        // Рендерим сетку с фильмами и лоадер пагинации
        <>
          <div className={getGridClasses(posterSize, gapSize)}>
            {movies.map((movie, index) => (
              <MovieCard
                key={`${movie.id}-${index}`}
                movie={movie}
                index={index}
                isLastElement={index === movies.length - 1}
              />
            ))}
          </div>

          {/* Индикатор загрузки для пагинации */}
          {isLoadingMore && (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
            </div>
          )}

          {/* Сообщение, если больше нет фильмов */}
          {!hasMore && movies.length > 0 && (
            <p className="text-center text-gray-500 py-10">
              Это все популярные фильмы.
            </p>
          )}
        </>
      )}
    </div>
  );
}
