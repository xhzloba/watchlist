"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getImageUrl,
  type Movie as LocalMovieType,
  getPopularMoviesOnly,
  getYear,
  Movie,
} from "@/lib/tmdb";
import { playSound } from "@/lib/sound-utils";
import { useReleaseQualityVisibility } from "@/components/movie-card-wrapper";
import { STORAGE_KEYS } from "@/lib/constants";
import { ensurePlainMovieObject } from "@/lib/movie-utils";
import { useUISettings } from "@/context/UISettingsContext";

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

  // Рефы для логики восстановления/сохранения
  const isScrollRestored = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- НАЧАЛО: Функция сохранения состояния ---
  const saveState = useCallback(() => {
    try {
      const scrollPosition = window.scrollY;
      // Используем ключи с суффиксом _popular
      sessionStorage.setItem(
        STORAGE_KEYS.MOVIES + "_popular",
        JSON.stringify(movies)
      );
      sessionStorage.setItem(STORAGE_KEYS.PAGE + "_popular", page.toString());
      sessionStorage.setItem(
        STORAGE_KEYS.HAS_MORE + "_popular",
        hasMore.toString()
      );
      sessionStorage.setItem(
        STORAGE_KEYS.SCROLL_POSITION + "_popular",
        scrollPosition.toString()
      );
      sessionStorage.setItem(
        STORAGE_KEYS.LAST_VIEW + "_popular",
        pathname + window.location.search
      );

      console.log("[Popular Save] Состояние сохранено:", {
        moviesCount: movies.length,
        page,
        hasMore,
        scrollY: scrollPosition,
        path: pathname + window.location.search,
        time: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Ошибка при сохранении состояния:", error);
    }
  }, [movies, page, hasMore, pathname, searchParams]); // Добавляем зависимости
  // --- КОНЕЦ: Функция сохранения состояния ---

  // --- НАЧАЛО: useEffect для сохранения состояния ---
  useEffect(() => {
    // Добавляем обработчик события beforeunload для сохранения состояния
    window.addEventListener("beforeunload", saveState);

    // Находим все ссылки на фильмы и добавляем обработчик КЛИКА
    // Важно: Это сработает только ПОСЛЕ рендера карточек.
    // Возможно, лучше передать saveState в MovieCard через пропс
    // или использовать делегирование событий на родительском элементе.
    // Пока оставим так для простоты, но это может быть ненадежно
    // при динамической подгрузке.
    const movieLinks = document.querySelectorAll(".movie-card-popular"); // Используем новый класс
    movieLinks.forEach((link) => {
      link.addEventListener("click", saveState);
    });

    return () => {
      window.removeEventListener("beforeunload", saveState);
      movieLinks.forEach((link) => {
        link.removeEventListener("click", saveState);
      });
    };
    // Перезапускаем эффект при изменении saveState (т.е. при изменении movies, page, hasMore и т.д.)
    // и при изменении movies.length, чтобы перепривязать слушатели кликов к новым карточкам
  }, [saveState, movies.length]);
  // --- КОНЕЦ: useEffect для сохранения состояния ---

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

  // Функция загрузки фильмов (ОПРЕДЕЛЯЕМ ЗДЕСЬ)
  const fetchPopularMovies = useCallback(async (pageNum: number) => {
    // Устанавливаем isLoading/isLoadingMore как и раньше
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);
    try {
      console.log(`[Popular Fetch] Загрузка страницы ${pageNum}...`);
      const result = await getPopularMoviesOnly(pageNum);
      console.log(`[Popular Fetch] Получено ${result.items.length} элементов.`);

      // Use result.items and explicitly type map parameter as any
      const newMovies = result.items.map(
        (movie: any) => ensurePlainMovieObject(movie) as Movie
      );

      setMovies((prevMovies) =>
        pageNum === 1 ? newMovies : [...prevMovies, ...newMovies]
      );
      setHasMore(result.page < result.totalPages);
    } catch (err: any) {
      console.error("[Popular Page] Ошибка загрузки фильмов:", err);
      setError(
        err.message || "Произошла ошибка при загрузке популярных фильмов."
      );
      setHasMore(false);
    } finally {
      // Всегда снимаем флаги загрузки после завершения запроса
      if (pageNum === 1) setIsLoading(false);
      else setIsLoadingMore(false);
      // Флаг isRestoringState управляется в другом useEffect
      // if(isRestoringState) {
      //     setIsRestoringState(false);
      // }
    }
  }, []);

  // Загрузка фильмов ПОСЛЕ ЗАВЕРШЕНИЯ ВОССТАНОВЛЕНИЯ
  useEffect(() => {
    if (isRestoringState === false) {
      // Восстановление завершено, проверяем, нужно ли грузить данные
      // Если страница 1 и фильмы уже есть (восстановлены), не грузим
      if (!(page === 1 && movies.length > 0)) {
        console.log(
          `[Popular Fetch Init] Восстановление завершено. Запускаем fetch для страницы ${page}`
        );
        fetchPopularMovies(page);
      } else {
        console.log(
          `[Popular Fetch Init] Восстановление завершено. Фильмы для стр. 1 уже есть.`
        );
        // Если мы восстановили состояние, но isLoading остался true, сбросим его
        if (isLoading) setIsLoading(false);
      }
    } else {
      console.log("[Popular Fetch Init] Ожидание завершения восстановления...");
    }
    // Этот эффект срабатывает ТОЛЬКО при изменении isRestoringState
  }, [isRestoringState, fetchPopularMovies]); // Убираем page, movies.length, isLoading из зависимостей

  // Загрузка фильмов при ПАГИНАЦИИ
  useEffect(() => {
    // Запускаем только для страниц > 1 и после завершения восстановления
    if (!isRestoringState && page > 1) {
      console.log(`[Popular Pagination] Запускаем fetch для страницы ${page}`);
      fetchPopularMovies(page);
    }
    // Этот эффект срабатывает ТОЛЬКО при изменении page (для страниц > 1)
  }, [page, isRestoringState, fetchPopularMovies]);

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
    const fixedColGapClass = "gap-x-2";
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
    const { showCardGlow } = useUISettings(); // Получаем настройку свечения из контекста
    // Используем хук для получения настроек
    const {
      showReleaseQuality,
      roundedCorners,
      showTitles,
      yellowHover,
      showMovieRating, // Получаем настройку отображения рейтинга
    } = useReleaseQualityVisibility();

    const imageUrl = movie.poster_path
      ? getImageUrl(movie.poster_path, "w500")
      : "/placeholder.svg?height=300&width=200";
    const year = getYear(movie.release_date);
    const ratingValue = movie.vote_average;
    const rating = ratingValue ? ratingValue.toFixed(1) : "N/A";
    const releaseQuality = movie.releaseQuality;

    return (
      <div className="relative group">
        {/* Glow Element moved here - Условный рендеринг */}
        {showCardGlow && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-2/3 h-5 bg-gradient-to-t from-transparent to-gray-200/60 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20"></div>
        )}

        <Link
          href={`/movie/${movie.id}`}
          className={`movie-card movie-card-popular block relative overflow-hidden group ${
            roundedCorners ? "rounded-xl" : "rounded-md"
          } border-[3px] ${
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
          {/* Glow Element removed from here */}

          <Image
            src={imageUrl}
            alt={movie.title || "Постер фильма"}
            fill
            className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
            loading={index < 10 ? "eager" : "lazy"}
          />
          {/* Блок с рейтингом (как в discover) */}
          {showMovieRating && ratingValue !== undefined && (
            <div
              className={`absolute top-2 left-2 z-10 ${
                ratingValue >= 7.0
                  ? "bg-green-600"
                  : ratingValue >= 5.5
                  ? "bg-gray-600"
                  : "bg-red-600"
              } text-white text-xs font-bold px-2 py-1 rounded-md`}
            >
              {rating}
            </div>
          )}
          {/* Значок качества релиза (оставляем справа) */}
          {showReleaseQuality && releaseQuality && (
            <div className="absolute top-1.5 right-1.5 z-10">
              <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-[10px] font-bold rounded-lg shadow-lg">
                {releaseQuality}
              </span>
            </div>
          )}
        </Link>
        {showTitles && (
          <h3 className="text-sm font-medium truncate px-1">
            {movie.title || movie.name}
          </h3>
        )}
        {showTitles && <p className="text-xs text-gray-400 px-1">{year}</p>}
      </div>
    );
  };

  // --- НАЧАЛО: Логика восстановления состояния ---
  useEffect(() => {
    // Флаг, что восстановление было успешно и можно прокручивать
    let restoreSucceeded = false;
    let scrollPos = 0;

    try {
      // Используем ключи с суффиксом _popular
      const storedMovies = sessionStorage.getItem(
        STORAGE_KEYS.MOVIES + "_popular"
      );
      const storedPage = sessionStorage.getItem(STORAGE_KEYS.PAGE + "_popular");
      const storedScrollPosition = sessionStorage.getItem(
        STORAGE_KEYS.SCROLL_POSITION + "_popular"
      );
      const storedHasMore = sessionStorage.getItem(
        STORAGE_KEYS.HAS_MORE + "_popular"
      );
      // Добавляем проверку пути
      const savedPath = sessionStorage.getItem(
        STORAGE_KEYS.LAST_VIEW + "_popular"
      );
      const currentPath = pathname + window.location.search;

      console.log("[Popular Restore] Проверка сохраненного состояния:", {
        storedMovies: !!storedMovies,
        storedPage,
        storedScrollPosition,
        storedHasMore,
        savedPath,
        currentPath,
      });

      // Условие: есть сохраненные данные И путь совпадает
      if (
        storedMovies &&
        storedPage &&
        storedScrollPosition &&
        storedHasMore &&
        savedPath === currentPath
      ) {
        console.log("[Popular Restore] Попытка восстановления состояния...");
        const parsedMovies = JSON.parse(storedMovies);
        const pageNum = parseInt(storedPage);
        scrollPos = parseInt(storedScrollPosition || "0");

        if (Array.isArray(parsedMovies)) {
          setMovies(parsedMovies);
          setPage(pageNum);
          setHasMore(
            sessionStorage.getItem(STORAGE_KEYS.HAS_MORE + "_popular") ===
              "true"
          );
          setIsLoading(false);
          setIsLoadingMore(false);
          restoreSucceeded = true;
          console.log(
            "[Popular Restore] Состояние успешно восстановлено (фильмы, страница)."
          );
        } else {
          console.warn(
            "[Popular Restore] Сохраненные фильмы не являются массивом."
          );
          // Очищаем некорректные данные (используем ключ с суффиксом _popular)
          sessionStorage.removeItem(STORAGE_KEYS.MOVIES + "_popular");
        }
      } else {
        console.log(
          "[Popular Restore] Нет сохраненного состояния или условия не выполнены."
        );
        // Очищаем ключи для этой страницы, если условия не выполнены
        sessionStorage.removeItem(STORAGE_KEYS.MOVIES + "_popular");
        sessionStorage.removeItem(STORAGE_KEYS.PAGE + "_popular");
        sessionStorage.removeItem(STORAGE_KEYS.HAS_MORE + "_popular");
        sessionStorage.removeItem(STORAGE_KEYS.SCROLL_POSITION + "_popular");
        sessionStorage.removeItem(STORAGE_KEYS.LAST_VIEW + "_popular"); // Также чистим путь
      }
    } catch (e) {
      console.error(
        "[Popular Restore] Ошибка парсинга или установки состояния:",
        e
      );
      // Очищаем потенциально битые данные (используем ключи с суффиксом _popular)
      sessionStorage.removeItem(STORAGE_KEYS.MOVIES + "_popular");
      sessionStorage.removeItem(STORAGE_KEYS.PAGE + "_popular"); // Добавил очистку страницы
    } finally {
      // В любом случае завершаем фазу восстановления
      console.log(
        "[Popular Restore] Завершение фазы восстановления, isRestoringState = false"
      );
      setIsRestoringState(false);

      // Если восстановление было успешным, выполняем прокрутку
      if (restoreSucceeded) {
        isScrollRestored.current = true;
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        console.log(`[Popular Restore] Прокрутка к ${scrollPos}px`);
        // Используем requestAnimationFrame для прокрутки после рендера
        requestAnimationFrame(() => {
          scrollTimeoutRef.current = setTimeout(() => {
            window.scrollTo({ top: scrollPos, behavior: "auto" });
            console.log(`[Popular Restore] Скролл выполнен.`);
          }, 50); // Небольшая задержка
        });
      }
    }

    // Очистка таймера при размонтировании
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [pathname]); // Зависимость только от pathname
  // --- КОНЕЦ: Логика восстановления состояния ---

  // --- Рендеринг PopularContent ---
  // Лоадер теперь показывается только если НЕТ восстановленного состояния
  // и идет загрузка ПЕРВОЙ страницы
  if (isLoading && page === 1 && movies.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#121212] z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

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
