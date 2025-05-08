"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Header from "@/components/header";
import GradientBackground from "@/components/gradient-background";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getImageUrl, Movie } from "@/lib/tmdb";
import { STORAGE_KEYS } from "@/lib/constants";
import DynamicHeading from "./dynamic-heading";
import { playSound } from "@/lib/sound-utils";
import { throttle } from "lodash";
import { useReleaseQualityVisibility } from "@/components/movie-card-wrapper";
import { useUISettings } from "@/context/UISettingsContext";
import DiscoverFilterBar from "@/components/discover/DiscoverFilterBar";
import FilterPopoverContent from "@/components/discover/FilterPopoverContent";
import CategoryPopoverContent from "@/components/discover/CategoryPopoverContent";
import clsx from "clsx";
import { Star, X as CloseIcon } from "lucide-react";

// Определяем ключи для localStorage
const DISCOVER_SETTINGS_POSTER_SIZE_KEY = "discover_poster_size";
const DISCOVER_SETTINGS_GAP_SIZE_KEY = "discover_gap_size";
const DISCOVER_SETTINGS_VIEW_MODE_KEY = "discover_view_mode";

// Определяем тип PosterSize
type PosterSize = "small" | "medium" | "large";

// Определяем тип GapSize для размеров row-gap
type GapSize = "m" | "l" | "xl";

// Определяем тип ViewMode
type ViewMode = "grid" | "list";

// Расширяем базовый тип Movie, добавляя опциональное поле release_quality
interface DiscoverMovie extends Movie {
  release_quality?: { type: string }; // Или более точный тип, если известен
  name?: string; // Похоже, используется в MovieCard
  first_air_date?: string; // Похоже, используется в MovieCard
}

// Обновленный интерфейс для позиции попапа
interface PopoverPositionState {
  left: number;
  triggerTop: number; // Верх триггера относительно viewport
  triggerBottom: number; // Низ триггера относительно viewport
  isStickyAtOpen: boolean;
}

function DiscoverContent() {
  const [movies, setMovies] = useState<DiscoverMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRestoringState, setIsRestoringState] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastParams = useRef("");

  const [posterSize, setPosterSize] = useState<PosterSize>("medium");
  const [gapSize, setGapSize] = useState<GapSize>("m");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Состояния и реф для липкой панели (перенесены ВЫШЕ)
  const [isSticky, setIsSticky] = useState(false);
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const filterBarWrapperRef = useRef<HTMLDivElement>(null);

  // useEffect для управления липкостью (перенесен ВЫШЕ)
  useEffect(() => {
    const wrapper = filterBarWrapperRef.current;
    if (!wrapper) return;

    setToolbarHeight(wrapper.offsetHeight);

    const handleScroll = () => {
      if (wrapper) {
        const offsetTop = wrapper.offsetTop;
        setIsSticky(window.scrollY > offsetTop);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // --- Состояния и рефы для попапов ---
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  const [isCategoryClosing, setIsCategoryClosing] = useState(false);
  const categoryPopoverRef = useRef<HTMLDivElement>(null);
  const categoryTriggerRef = useRef<HTMLButtonElement>(null);
  const categoryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Используем новый тип для состояния
  const [popoverPosition, setPopoverPosition] =
    useState<PopoverPositionState | null>(null);

  // --- Popover Control Functions ---
  const openFilterModal = useCallback(() => {
    setIsFilterModalOpen(true);
    if (isCategoryPopoverOpen) {
      closeCategoryPopover();
    }
  }, [isCategoryPopoverOpen]);

  const closeFilterModal = useCallback(() => {
    setIsFilterModalOpen(false);
  }, []);

  const openCategoryPopover = useCallback(() => {
    if (categoryTimeoutRef.current) clearTimeout(categoryTimeoutRef.current);
    if (categoryTriggerRef.current) {
      const rect = categoryTriggerRef.current.getBoundingClientRect();
      // Сохраняем координаты триггера и флаг липкости
      setPopoverPosition({
        left: rect.left,
        triggerTop: rect.top,
        triggerBottom: rect.bottom,
        isStickyAtOpen: isSticky,
      });
    }
    setIsCategoryClosing(false);
    setIsCategoryPopoverOpen(true);
    if (isFilterModalOpen) {
      closeFilterModal();
    }
  }, [isFilterModalOpen, isSticky]);

  const closeCategoryPopover = useCallback(() => {
    setIsCategoryClosing(true);
    categoryTimeoutRef.current = setTimeout(() => {
      setIsCategoryPopoverOpen(false);
      setIsCategoryClosing(false);
      setPopoverPosition(null);
    }, 300);
  }, []);

  // --- Click Outside Handler ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isCategoryPopoverOpen &&
        categoryPopoverRef.current &&
        !categoryPopoverRef.current.contains(event.target as Node) &&
        categoryTriggerRef.current &&
        !categoryTriggerRef.current.contains(event.target as Node)
      ) {
        closeCategoryPopover();
      }
    };

    if (isCategoryPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (categoryTimeoutRef.current) clearTimeout(categoryTimeoutRef.current);
    };
  }, [isCategoryPopoverOpen, closeCategoryPopover]);

  // --- Filter State and Handlers ---
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");

  useEffect(() => {
    const genresParam = searchParams.get("with_genres");
    setSelectedGenres(
      genresParam ? genresParam.split(",").map((id) => parseInt(id, 10)) : []
    );
    const yearParam = searchParams.get("year");
    setSelectedYear(yearParam || "");
    const countryParam = searchParams.get("with_origin_country");
    setSelectedCountry(countryParam || "");
  }, [searchParams]);

  const handleGenreToggle = (genreId: number) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  };
  const handleYearSelect = (year: string) => {
    setSelectedYear((prev) => (prev === year ? "" : year));
  };
  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountry((prev) => (prev === countryCode ? "" : countryCode));
  };

  const clearFilterAndNavigate = (paramToClear: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete(paramToClear);

    const genreParam = newParams.get("with_genres");
    const yearParam = newParams.get("year");
    const countryParam = newParams.get("with_origin_country");
    const otherFiltersActive = genreParam || yearParam || countryParam;

    if (!otherFiltersActive) {
      newParams.delete("sort_by");
    }

    newParams.delete("page");
    Object.values(STORAGE_KEYS).forEach((key) => {
      if (key !== STORAGE_KEYS.FROM_DISCOVER) sessionStorage.removeItem(key);
    });
    newParams.set("t", Date.now().toString());

    router.push(`/discover?${newParams.toString()}`, { scroll: false });
    // Don't close popover here, allow continued filtering
  };

  const handleClearGenres = () => {
    setSelectedGenres([]);
    clearFilterAndNavigate("with_genres");
  };
  const handleClearYear = () => {
    setSelectedYear("");
    clearFilterAndNavigate("year");
  };
  const handleClearCountry = () => {
    setSelectedCountry("");
    clearFilterAndNavigate("with_origin_country");
  };

  const applyFiltersFromModal = () => {
    const newParams = new URLSearchParams();

    if (selectedGenres.length > 0) {
      newParams.set("with_genres", selectedGenres.join(","));
    }
    if (selectedYear) {
      newParams.set("year", selectedYear);
    }
    if (selectedCountry) {
      newParams.set("with_origin_country", selectedCountry);
    }

    if (selectedGenres.length > 0 || selectedYear || selectedCountry) {
      newParams.set("sort_by", "popularity.desc");
    }

    const essentialKeys = ["size", "gap", "view"];
    searchParams.forEach((value, key) => {
      if (essentialKeys.includes(key)) {
        newParams.set(key, value);
      }
    });

    newParams.set("t", Date.now().toString());

    Object.values(STORAGE_KEYS).forEach((key) => {
      if (key !== STORAGE_KEYS.FROM_DISCOVER) sessionStorage.removeItem(key);
    });

    router.push(`/discover?${newParams.toString()}`, { scroll: false });
    closeFilterModal();
  };

  // Инициализация posterSize, gapSize и viewMode при монтировании
  useEffect(() => {
    let initialSize: PosterSize = "medium";
    let initialGap: GapSize = "m";
    let initialView: ViewMode = "grid";

    try {
      const storedSize = localStorage.getItem(
        DISCOVER_SETTINGS_POSTER_SIZE_KEY
      );
      const storedGap = localStorage.getItem(DISCOVER_SETTINGS_GAP_SIZE_KEY);
      const storedView = localStorage.getItem(DISCOVER_SETTINGS_VIEW_MODE_KEY);

      if (storedSize && ["small", "medium", "large"].includes(storedSize)) {
        initialSize = storedSize as PosterSize;
      } else {
        const sizeParam = searchParams.get("size");
        if (sizeParam && ["small", "medium", "large"].includes(sizeParam)) {
          initialSize = sizeParam as PosterSize;
          localStorage.setItem(DISCOVER_SETTINGS_POSTER_SIZE_KEY, initialSize);
        }
      }

      if (storedGap && ["m", "l", "xl"].includes(storedGap)) {
        initialGap = storedGap as GapSize;
      } else {
        const gapParam = searchParams.get("gap");
        if (gapParam && ["m", "l", "xl"].includes(gapParam)) {
          initialGap = gapParam as GapSize;
          localStorage.setItem(DISCOVER_SETTINGS_GAP_SIZE_KEY, initialGap);
        }
      }

      if (storedView && ["grid", "list"].includes(storedView)) {
        initialView = storedView as ViewMode;
      } else {
        const viewParam = searchParams.get("view");
        if (viewParam && ["grid", "list"].includes(viewParam)) {
          initialView = viewParam as ViewMode;
          localStorage.setItem(DISCOVER_SETTINGS_VIEW_MODE_KEY, initialView);
        }
      }
    } catch (error) {
      console.error("Error reading settings from localStorage:", error);
    }

    setPosterSize(initialSize);
    setGapSize(initialGap);
    setViewMode(initialView);

    const currentParams = new URLSearchParams(searchParams.toString());
    let urlNeedsUpdate = false;
    if (currentParams.get("size") !== initialSize) {
      currentParams.set("size", initialSize);
      urlNeedsUpdate = true;
    }
    if (currentParams.get("gap") !== initialGap) {
      currentParams.set("gap", initialGap);
      urlNeedsUpdate = true;
    }
    if (currentParams.get("view") !== initialView) {
      currentParams.set("view", initialView);
      urlNeedsUpdate = true;
    }

    if (urlNeedsUpdate) {
      router.replace(`${pathname}?${currentParams.toString()}`, {
        scroll: false,
      });
    }
  }, []);

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

  // Scroll logging and popstate handling
  useEffect(() => {
    const logScrollPosition = () => {
      // console.log(`[SCROLL DEBUG] Текущая позиция: ${window.scrollY}px`);
    };
    const throttledLogScroll = throttle(logScrollPosition, 500);
    window.addEventListener("scroll", throttledLogScroll);

    const handlePopState = () => {
      console.log(
        "[SCROLL POPSTATE] Обработка события popstate (навигация назад/вперед)"
      );
      if (document.referrer.includes("/movie/")) {
        console.log(
          "[SCROLL POPSTATE] Возврат со страницы фильма, устанавливаем FROM_DISCOVER=true"
        );
        sessionStorage.setItem(STORAGE_KEYS.FROM_DISCOVER, "true");
      }
    };
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("scroll", throttledLogScroll);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // State saving logic
  const saveScrollState = useCallback(() => {
    try {
      if (movies.length > 0) {
        const scrollPosition = window.scrollY;
        sessionStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(movies));
        sessionStorage.setItem(STORAGE_KEYS.PAGE, page.toString());
        sessionStorage.setItem(STORAGE_KEYS.HAS_MORE, hasMore.toString());
        sessionStorage.setItem(
          STORAGE_KEYS.SCROLL_POSITION,
          scrollPosition.toString()
        );
        sessionStorage.setItem(STORAGE_KEYS.FROM_DISCOVER, "true");
        sessionStorage.setItem(
          STORAGE_KEYS.LAST_VIEW,
          pathname + window.location.search
        );
        console.log("[SCROLL SAVE] Состояние сохранено:", {
          moviesCount: movies.length,
          page,
          hasMore,
          scrollY: scrollPosition,
          path: pathname + window.location.search,
          time: new Date().toISOString(),
        });
      } else {
        console.log("[SCROLL SAVE] Skipping save, no movies loaded yet.");
      }
    } catch (error) {
      console.error("Ошибка при сохранении состояния:", error);
    }
  }, [movies, page, hasMore, pathname, searchParams]);

  useEffect(() => {
    window.addEventListener("beforeunload", saveScrollState);
    return () => {
      window.removeEventListener("beforeunload", saveScrollState);
    };
  }, [saveScrollState]);

  const isScrollRestored = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State restoration logic
  useEffect(() => {
    const savedMovies = sessionStorage.getItem(STORAGE_KEYS.MOVIES);
    const savedPage = sessionStorage.getItem(STORAGE_KEYS.PAGE);
    const savedScrollPosition = sessionStorage.getItem(
      STORAGE_KEYS.SCROLL_POSITION
    );
    const savedPath = sessionStorage.getItem(STORAGE_KEYS.LAST_VIEW);
    const currentPath = pathname + window.location.search;
    const fromDiscover = sessionStorage.getItem(STORAGE_KEYS.FROM_DISCOVER);

    const backupScrollPosition = localStorage.getItem("backup_scroll_position");
    const backupPath = localStorage.getItem("backup_path");
    const backupTimestamp = localStorage.getItem("backup_timestamp");

    console.log("[SCROLL DEBUG] Проверка сохраненного состояния:", {
      hasSavedMovies: !!savedMovies,
      hasSavedPage: !!savedPage,
      savedScrollPosition,
      savedPath,
      currentPath,
      isSamePath: savedPath === currentPath,
      fromDiscover,
    });

    let shouldRestore = false;
    let finalScrollPosition: string | null = null;

    if (
      savedMovies &&
      savedPage &&
      savedPath &&
      currentPath &&
      savedPath === currentPath &&
      fromDiscover === "true"
    ) {
      shouldRestore = true;
      finalScrollPosition = savedScrollPosition;
    } else if (
      !shouldRestore &&
      backupPath &&
      currentPath &&
      backupPath === currentPath &&
      backupScrollPosition
    ) {
      const hasReferrer = typeof document !== "undefined" && document.referrer;
      const isFromMoviePage =
        hasReferrer && document.referrer.includes("/movie/");
      if (
        isFromMoviePage ||
        (backupTimestamp && Date.now() - parseInt(backupTimestamp) < 300000)
      ) {
        shouldRestore = true;
        finalScrollPosition = backupScrollPosition;
        sessionStorage.setItem(STORAGE_KEYS.FROM_DISCOVER, "true");
      }
    }

    console.log("[SCROLL DEBUG] Решение о восстановлении:", {
      shouldRestore,
      finalScrollPosition,
      source: shouldRestore
        ? finalScrollPosition === savedScrollPosition
          ? "sessionStorage"
          : "localStorage"
        : "none",
    });

    if (shouldRestore && finalScrollPosition) {
      console.log("[SCROLL RESTORE] Восстанавливаем состояние:");
      isScrollRestored.current = true;
      try {
        if (savedMovies) {
          const parsedMovies = JSON.parse(savedMovies);
          if (Array.isArray(parsedMovies)) {
            setMovies(parsedMovies as DiscoverMovie[]);
            console.log(
              `[SCROLL RESTORE] Восстановлено ${parsedMovies.length} фильмов`
            );
          } else {
            setMovies([]);
          }
          if (savedPage) {
            setPage(parseInt(savedPage));
            setHasMore(
              sessionStorage.getItem(STORAGE_KEYS.HAS_MORE) === "true"
            );
            setIsLoading(false);
          }
        }
      } catch (e) {
        setMovies([]);
      }

      const scrollToPosition = parseInt(finalScrollPosition);
      console.log(
        `[SCROLL RESTORE] Восстанавливаем прокрутку к позиции: ${scrollToPosition}px`
      );
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

      scrollTimeoutRef.current = setTimeout(() => {
        console.log(
          `[SCROLL RESTORE] Выполняем scrollTo(0, ${scrollToPosition})`
        );
        window.scrollTo({ top: scrollToPosition, behavior: "auto" });
        setTimeout(() => {
          if (Math.abs(window.scrollY - scrollToPosition) > 100) {
            window.scrollTo({ top: scrollToPosition, behavior: "auto" });
          }
          console.log(
            "[SCROLL RESTORE] Скролл восстановлен, НЕ очищаем флаг FROM_DISCOVER"
          );
        }, 100);
        setIsRestoringState(false);
      }, 500);
    } else {
      console.log(
        "[SCROLL DEBUG] Новая страница обзора, очищаем сохраненное состояние"
      );
      sessionStorage.removeItem(STORAGE_KEYS.MOVIES);
      sessionStorage.removeItem(STORAGE_KEYS.PAGE);
      sessionStorage.removeItem(STORAGE_KEYS.HAS_MORE);
      sessionStorage.removeItem(STORAGE_KEYS.SCROLL_POSITION);
      sessionStorage.removeItem(STORAGE_KEYS.LAST_VIEW);
      setIsRestoringState(false);
      isScrollRestored.current = false;
    }
  }, [pathname, searchParams]);

  // Fetching movies logic
  useEffect(() => {
    if (isRestoringState) {
      console.log("[EFFECT FETCH] Skipping fetch during restore state");
      return;
    }
    const fetchMovies = async () => {
      console.log(`[EFFECT FETCH] Fetching movies for page ${page}...`);
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);
      try {
        const currentParams = new URLSearchParams(searchParams.toString());
        currentParams.set("page", page.toString());
        const response = await fetch(
          `/api/discover?${currentParams.toString()}`
        );
        if (!response.ok) {
          throw new Error(`Ошибка получения фильмов: ${response.status}`);
        }
        const data = await response.json();
        if (!data.results || !Array.isArray(data.results)) {
          throw new Error("Неверный формат данных от API");
        }
        const newMovies: DiscoverMovie[] = data.results.map(
          (item: any) => item as DiscoverMovie
        );
        const deduplicatedResults = Array.from(
          new Map(newMovies.map((movie) => [movie.id, movie])).values()
        );
        setMovies((prevMovies) => {
          if (page === 1) {
            return deduplicatedResults;
          } else {
            const allMoviesMap = new Map<number, DiscoverMovie>(
              [...prevMovies, ...deduplicatedResults].map((movie) => [
                movie.id,
                movie,
              ])
            );
            return Array.from(allMoviesMap.values());
          }
        });
        setHasMore(data.page < data.total_pages);
      } catch (error: unknown) {
        console.error("Ошибка при загрузке фильмов:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Произошла неизвестная ошибка при загрузке фильмов"
        );
      } finally {
        if (page === 1) setIsLoading(false);
        setIsLoadingMore(false);
      }
    };
    fetchMovies();
  }, [page, isRestoringState, searchParams]);

  // Reset state on filter change logic
  useEffect(() => {
    if (isRestoringState) {
      const timer = setTimeout(() => setIsRestoringState(false), 0);
      return () => clearTimeout(timer);
    }
    const filterParams = new URLSearchParams();
    const relevantKeys = [
      "with_genres",
      "year",
      "with_origin_country",
      "trending",
      "sort_by",
      "query",
    ];
    searchParams.forEach((value, key) => {
      if (relevantKeys.includes(key)) {
        filterParams.set(key, value);
      }
    });
    const currentFilterString = filterParams.toString();
    if (currentFilterString !== lastParams.current) {
      console.log("[EFFECT PARAMS] Filter params changed! Resetting state.", {
        prev: lastParams.current,
        current: currentFilterString,
      });
      lastParams.current = currentFilterString;
      setPage(1);
      setMovies([]);
      setIsLoading(true);
      setHasMore(true);
      setError(null);
      Object.values(STORAGE_KEYS).forEach((key) => {
        if (key !== STORAGE_KEYS.FROM_DISCOVER) sessionStorage.removeItem(key);
      });
    }
  }, [searchParams]);

  // Save current path logic
  useEffect(() => {
    const currentPath = pathname + window.location.search;
    sessionStorage.setItem(STORAGE_KEYS.LAST_VIEW, currentPath);
    console.log("[SCROLL PATH] Сохранен текущий путь:", currentPath);
    return () => {
      console.log("[SCROLL PATH] Компонент DiscoverContent размонтирован");
    };
  }, [pathname, searchParams]);

  // --- Grid Movie Card Component ---
  const MovieCard = ({
    movie,
    index,
    isLastElement,
    titleFontClass,
  }: {
    movie: DiscoverMovie;
    index: number;
    isLastElement: boolean;
    titleFontClass?: string;
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const { showCardGlow } = useUISettings();
    const {
      showMovieRating,
      roundedCorners,
      showTitles,
      yellowHover,
      showReleaseQuality,
    } = useReleaseQualityVisibility();
    const releaseQuality = movie.release_quality || null;
    const year =
      movie.release_date?.split("-")[0] || movie.first_air_date?.split("-")[0];
    const ratingValue = movie.vote_average;
    const rating = ratingValue ? ratingValue.toFixed(1) : "N/A";
    const imageUrl = movie.poster_path
      ? getImageUrl(movie.poster_path, "w500")
      : "/placeholder.svg";

    const handleClick = () => {
      playSound("choose.mp3");
      saveScrollState();

      const currentScrollY = window.scrollY;
      const currentPath = pathname + window.location.search;
      try {
        localStorage.setItem(
          "backup_scroll_position",
          currentScrollY.toString()
        );
        localStorage.setItem("backup_path", currentPath);
        localStorage.setItem("backup_last_movie_id", movie.id.toString());
        localStorage.setItem("backup_timestamp", Date.now().toString());
      } catch (error) {
        console.error(
          "[SCROLL CLICK] Ошибка при сохранении backup состояния:",
          error
        );
      }
    };

    return (
      <div
        className="relative group"
        ref={isLastElement ? lastMovieElementRef : null}
      >
        {showCardGlow && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-2/3 h-5 bg-gradient-to-t from-transparent to-gray-200/60 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20"></div>
        )}
        <Link
          href={`/movie/${movie.id}`}
          className={`movie-card block relative group overflow-hidden ${
            roundedCorners ? "rounded-xl" : "rounded-md"
          } border-[3px] ${
            isHovered
              ? yellowHover
                ? "border-yellow-500"
                : "border-white"
              : "border-transparent"
          } transition-all duration-200 mb-2`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleClick}
        >
          <div className={`relative aspect-[2/3] w-full h-full`}>
            <img
              src={imageUrl}
              alt={movie.title || movie.name || ""}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading={index < 10 ? "eager" : "lazy"}
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
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
            {showReleaseQuality && releaseQuality && (
              <div className="absolute top-1.5 right-1.5 z-10">
                <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-[10px] font-bold rounded-lg shadow-lg">
                  {typeof releaseQuality === "object" && releaseQuality.type
                    ? releaseQuality.type
                    : "HDRip"}
                </span>
              </div>
            )}
          </div>
        </Link>
        {showTitles && (
          <h3
            className={`text-sm font-medium truncate px-1 mt-1 ${
              titleFontClass || ""
            }`}
          >
            {movie.title || movie.name}
          </h3>
        )}
        {showTitles && year && (
          <p className={`text-xs text-gray-400 px-1 ${titleFontClass || ""}`}>
            {year}
          </p>
        )}
      </div>
    );
  };

  // --- List Movie Item Component ---
  const MovieListItem = ({
    movie,
    index,
    isLastElement,
    titleFontClass,
  }: {
    movie: DiscoverMovie;
    index: number;
    isLastElement: boolean;
    titleFontClass?: string;
  }) => {
    const { showReleaseQuality } = useReleaseQualityVisibility();
    const releaseQuality = movie.release_quality || null;
    const year =
      movie.release_date?.split("-")[0] || movie.first_air_date?.split("-")[0];
    const ratingValue = movie.vote_average;
    const rating = ratingValue ? ratingValue.toFixed(1) : "N/A";
    const imageUrl = movie.poster_path
      ? getImageUrl(movie.poster_path, "w500")
      : "/placeholder.svg";

    const handleClick = () => {
      playSound("choose.mp3");
      saveScrollState();

      const currentScrollY = window.scrollY;
      const currentPath = pathname + window.location.search;
      try {
        localStorage.setItem(
          "backup_scroll_position",
          currentScrollY.toString()
        );
        localStorage.setItem("backup_path", currentPath);
        localStorage.setItem("backup_last_movie_id", movie.id.toString());
        localStorage.setItem("backup_timestamp", Date.now().toString());
      } catch (error) {
        console.error(
          "[SCROLL CLICK] Ошибка при сохранении backup состояния:",
          error
        );
      }
    };

    const refProps = isLastElement ? { ref: lastMovieElementRef } : {};

    return (
      <Link
        href={`/movie/${movie.id}`}
        key={movie.id}
        onClick={handleClick}
        className="group flex items-start p-3 bg-zinc-800/50 hover:bg-yellow-500 rounded-lg transition-colors duration-200 gap-4"
        {...refProps}
      >
        <div className="flex-shrink-0 w-40 aspect-[2/3] rounded-md overflow-hidden relative shadow-md">
          <img
            src={imageUrl}
            alt={`Постер ${movie.title || movie.name}`}
            className="w-full h-full object-cover"
            loading={index < 10 ? "eager" : "lazy"}
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg";
            }}
          />
          {ratingValue !== undefined && (
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
          {showReleaseQuality && releaseQuality && (
            <div
              className={clsx(
                "absolute top-1 right-1 text-[9px] font-semibold px-1.5 py-0.5 rounded",
                releaseQuality.type === "CAM"
                  ? "bg-red-600/80 text-white"
                  : releaseQuality.type === "TS"
                  ? "bg-orange-500/80 text-white"
                  : "bg-green-600/80 text-white"
              )}
            >
              {releaseQuality.type}
            </div>
          )}
        </div>

        <div className="flex-grow">
          <h3
            className={`text-lg font-semibold text-white group-hover:text-black mb-1 line-clamp-2 transition-colors duration-200 ${
              titleFontClass || ""
            }`}
          >
            {movie.title || movie.name || "Без названия"}
          </h3>
          <p
            className={`text-sm text-zinc-400 group-hover:text-black mb-2 transition-colors duration-200 ${
              titleFontClass || ""
            }`}
          >
            {year}
          </p>
          <p
            className={`text-sm text-zinc-400 group-hover:text-black line-clamp-3 transition-colors duration-200 ${
              titleFontClass || ""
            }`}
          >
            {movie.overview || "Описание недоступно."}
          </p>
        </div>
      </Link>
    );
  };

  // Функция для получения классов сетки (GRID VIEW ONLY)
  const getGridClasses = (size: PosterSize, gap: GapSize): string => {
    let gapClass = "";
    switch (gap) {
      case "m":
        gapClass = "gap-x-2 gap-y-4";
        break;
      case "l":
        gapClass = "gap-x-2 gap-y-8";
        break;
      case "xl":
        gapClass = "gap-x-2 gap-y-24";
        break;
      default:
        gapClass = "gap-x-2 gap-y-4";
    }
    let baseClass = "";
    switch (size) {
      case "small":
        baseClass =
          "grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-9 2xl:grid-cols-10";
        break;
      case "medium":
        baseClass =
          "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9";
        break;
      case "large":
        baseClass =
          "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7";
        break;
      default:
        baseClass =
          "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9";
    }
    return `${baseClass} ${gapClass}`;
  };

  // --- Handlers for settings changes ---
  const handleSizeChange = (newSize: PosterSize) => {
    setPosterSize(newSize);
    const params = new URLSearchParams(searchParams.toString());
    params.set("size", newSize);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    try {
      localStorage.setItem(DISCOVER_SETTINGS_POSTER_SIZE_KEY, newSize);
    } catch (error) {
      console.error("Error writing posterSize to localStorage:", error);
    }
  };

  const handleGapChange = (newGap: GapSize) => {
    setGapSize(newGap);
    const params = new URLSearchParams(searchParams.toString());
    params.set("gap", newGap);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    try {
      localStorage.setItem(DISCOVER_SETTINGS_GAP_SIZE_KEY, newGap);
    } catch (error) {
      console.error("Error writing gapSize to localStorage:", error);
    }
  };

  const handleViewChange = (newView: ViewMode) => {
    setViewMode(newView);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newView);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    try {
      localStorage.setItem(DISCOVER_SETTINGS_VIEW_MODE_KEY, newView);
    } catch (error) {
      console.error("Error writing viewMode to localStorage:", error);
    }
  };

  return (
    <div className="min-h-screen text-white">
      <Header />
      <main className="px-4 sm:px-6 pt-24 pb-8">
        <div className="max-w-full mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
            <div className="flex-grow mr-0 sm:mr-4 w-full sm:w-auto mb-4 sm:mb-0 hidden xl:block">
              <DynamicHeading titleFontClass="font-exo-2" />
            </div>
            <DiscoverFilterBar
              posterSize={posterSize}
              onSizeChange={handleSizeChange}
              gapSize={gapSize}
              onGapChange={handleGapChange}
              currentViewMode={viewMode}
              onViewChange={handleViewChange}
              categoryTriggerRef={categoryTriggerRef}
              onOpenCategoryPopover={openCategoryPopover}
              onOpenFilterModal={openFilterModal}
              isSticky={isSticky}
              toolbarHeight={toolbarHeight}
              wrapperRef={filterBarWrapperRef}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center mt-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center mt-10">
              <h3 className="text-xl mb-2">Произошла ошибка</h3>
              <p>{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setPage(1);
                  setMovies([]);
                  setIsLoading(true);
                }}
                className="mt-4 px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-400"
              >
                Попробовать снова
              </button>
            </div>
          ) : movies.length === 0 ? (
            <div className="text-center mt-10">
              <h3 className="text-xl">Фильмы не найдены</h3>
              <p className="text-gray-400 mt-2">
                Попробуйте изменить параметры поиска
              </p>
            </div>
          ) : (
            <div>
              {viewMode === "grid" ? (
                <div className={getGridClasses(posterSize, gapSize)}>
                  {movies.map((movie, index) => (
                    <MovieCard
                      key={`${movie.id}-grid`}
                      movie={movie}
                      index={index}
                      isLastElement={index === movies.length - 1}
                      titleFontClass="font-exo-2"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {movies.map((movie, index) => (
                    <MovieListItem
                      key={`${movie.id}-list`}
                      movie={movie}
                      index={index}
                      isLastElement={index === movies.length - 1}
                      titleFontClass="font-exo-2"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          {isLoadingMore && (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
            </div>
          )}
        </div>

        {/* Рендеринг попапа категорий с position: fixed */}
        {isCategoryPopoverOpen && popoverPosition && (
          <div
            ref={categoryPopoverRef}
            // Используем position: fixed
            className={clsx("fixed z-[999]", {
              // Анимации могут потребовать корректировки
              "animate-slideDown":
                !isCategoryClosing && !popoverPosition.isStickyAtOpen,
              "animate-slideUp":
                isCategoryClosing && !popoverPosition.isStickyAtOpen,
              "animate-scaleInFromBottom":
                !isCategoryClosing && popoverPosition.isStickyAtOpen,
              "animate-scaleOutToBottom":
                isCategoryClosing && popoverPosition.isStickyAtOpen,
            })}
            style={{
              left: `${popoverPosition.left}px`,
              // Устанавливаем top или bottom в зависимости от isStickyAtOpen
              ...(popoverPosition.isStickyAtOpen
                ? {
                    bottom: `${
                      window.innerHeight - popoverPosition.triggerTop + 8
                    }px`,
                  }
                : {
                    top: `${popoverPosition.triggerBottom + 8}px`,
                  }),
              // Устанавливаем transform-origin для анимации
              transformOrigin: popoverPosition.isStickyAtOpen
                ? "bottom left"
                : "top left",
            }}
          >
            {/* Убираем лишнюю обертку для transformOrigin, он теперь в style выше */}
            <CategoryPopoverContent onClose={closeCategoryPopover} />
          </div>
        )}

        {isFilterModalOpen && (
          <div className="fixed inset-0 z-[998] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="relative bg-zinc-800 rounded-lg shadow-xl max-w-2xl w-[90%] max-h-[85vh] overflow-hidden flex flex-col animate-scaleIn">
              <button
                onClick={closeFilterModal}
                className="absolute top-2 right-2 p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-full transition-colors z-10"
                aria-label="Закрыть фильтры"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
              <div className="overflow-y-auto flex-grow">
                <FilterPopoverContent
                  genres={genres}
                  years={years}
                  countries={countries}
                  selectedGenres={selectedGenres}
                  selectedYear={selectedYear}
                  selectedCountry={selectedCountry}
                  onGenreToggle={handleGenreToggle}
                  onYearSelect={handleYearSelect}
                  onCountrySelect={handleCountrySelect}
                  onClearGenres={handleClearGenres}
                  onClearYear={handleClearYear}
                  onClearCountry={handleClearCountry}
                  onApplyFilters={applyFiltersFromModal}
                />
              </div>
            </div>
            <div
              className="absolute inset-0 -z-10"
              onClick={closeFilterModal}
            ></div>
          </div>
        )}
      </main>
    </div>
  );
}

const genres = [
  { id: 28, name: "Боевик" },
  { id: 12, name: "Приключения" },
  { id: 16, name: "Мультфильм" },
  { id: 35, name: "Комедия" },
  { id: 80, name: "Криминал" },
  { id: 99, name: "Документальный" },
  { id: 18, name: "Драма" },
  { id: 10751, name: "Семейный" },
  { id: 14, name: "Фэнтези" },
  { id: 36, name: "История" },
  { id: 27, name: "Ужасы" },
  { id: 10402, name: "Музыка" },
  { id: 9648, name: "Детектив" },
  { id: 10749, name: "Мелодрама" },
  { id: 878, name: "Фантастика" },
  { id: 53, name: "Триллер" },
  { id: 10752, name: "Военный" },
  { id: 37, name: "Вестерн" },
];
const years = [
  "2025",
  "2024",
  "2023",
  "2022",
  "2021",
  "2020",
  "2019",
  "2018",
  "2017",
  "2016",
  "2015",
  "2014",
  "2013",
  "2012",
  "2011",
  "2010",
];
const countries = [
  { code: "RU", name: "Россия" },
  { code: "US", name: "США" },
  { code: "TR", name: "Турция" },
  { code: "GB", name: "Великобритания" },
  { code: "ES", name: "Испания" },
  { code: "KR", name: "Южная Корея" },
  { code: "IT", name: "Италия" },
  { code: "DE", name: "Германия" },
  { code: "JP", name: "Япония" },
  { code: "FR", name: "Франция" },
  { code: "IN", name: "Индия" },
];

export default function DiscoverPage() {
  return (
    <GradientBackground>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
          </div>
        }
      >
        <DiscoverContent />
      </Suspense>
    </GradientBackground>
  );
}
