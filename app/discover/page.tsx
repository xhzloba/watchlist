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
import MovieGrid from "@/components/movie-grid";
import DiscoverFilterBar from "@/components/discover/DiscoverFilterBar";
import FilterPopoverContent from "@/components/discover/FilterPopoverContent";
import CategoryPopoverContent from "@/components/discover/CategoryPopoverContent";
import clsx from "clsx";

// Определяем ключи для localStorage
const DISCOVER_SETTINGS_POSTER_SIZE_KEY = "discover_poster_size";
const DISCOVER_SETTINGS_GAP_SIZE_KEY = "discover_gap_size";

// Определяем тип PosterSize
type PosterSize = "small" | "medium" | "large";

// Определяем тип GapSize для размеров row-gap
type GapSize = "m" | "l" | "xl";

// Расширяем базовый тип Movie, добавляя опциональное поле release_quality
interface DiscoverMovie extends Movie {
  release_quality?: { type: string }; // Или более точный тип, если известен
  // Добавляем другие поля, если они используются, но отсутствуют в Movie
  name?: string; // Похоже, используется в MovieCard
  first_air_date?: string; // Похоже, используется в MovieCard
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

  // Состояния для размера постеров и промежутка
  // Инициализируем с дефолтными значениями, useEffect обновит их
  const [posterSize, setPosterSize] = useState<PosterSize>("medium");
  const [gapSize, setGapSize] = useState<GapSize>("m");

  // --- Popover States and Refs (Moved from DiscoverFilterBar) ---
  // Filter Popover
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [isFilterClosing, setIsFilterClosing] = useState(false);
  const filterPopoverRef = useRef<HTMLDivElement>(null);
  const filterTriggerRef = useRef<HTMLButtonElement>(null); // Ref for the trigger button
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Category Popover
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  const [isCategoryClosing, setIsCategoryClosing] = useState(false);
  const categoryPopoverRef = useRef<HTMLDivElement>(null);
  const categoryTriggerRef = useRef<HTMLButtonElement>(null); // Ref for the trigger button
  const categoryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Popover Position State
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left?: number;
    right?: number;
  } | null>(null);

  // --- Popover Control Functions ---
  const openFilterPopover = useCallback(() => {
    if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    // Calculate position based on trigger
    if (filterTriggerRef.current) {
      const rect = filterTriggerRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setIsFilterClosing(false);
    setIsFilterPopoverOpen(true);
    setIsCategoryPopoverOpen(false); // Close other popover
  }, []);

  const closeFilterPopover = useCallback(() => {
    setIsFilterClosing(true);
    filterTimeoutRef.current = setTimeout(() => {
      setIsFilterPopoverOpen(false);
      setIsFilterClosing(false);
      setPopoverPosition(null); // Reset position
    }, 300);
  }, []);

  const openCategoryPopover = useCallback(() => {
    if (categoryTimeoutRef.current) clearTimeout(categoryTimeoutRef.current);
    // Calculate position based on trigger
    if (categoryTriggerRef.current) {
      const rect = categoryTriggerRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left,
      });
    }
    setIsCategoryClosing(false);
    setIsCategoryPopoverOpen(true);
    setIsFilterPopoverOpen(false); // Close other popover
  }, []);

  const closeCategoryPopover = useCallback(() => {
    setIsCategoryClosing(true);
    categoryTimeoutRef.current = setTimeout(() => {
      setIsCategoryPopoverOpen(false);
      setIsCategoryClosing(false);
      setPopoverPosition(null); // Reset position
    }, 300);
  }, []);

  // --- Click Outside Handler ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close filter popover
      if (
        isFilterPopoverOpen &&
        filterPopoverRef.current &&
        !filterPopoverRef.current.contains(event.target as Node) &&
        filterTriggerRef.current &&
        !filterTriggerRef.current.contains(event.target as Node)
      ) {
        closeFilterPopover();
      }
      // Close category popover
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

    if (isFilterPopoverOpen || isCategoryPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
      if (categoryTimeoutRef.current) clearTimeout(categoryTimeoutRef.current);
    };
  }, [
    isFilterPopoverOpen,
    isCategoryPopoverOpen,
    closeFilterPopover,
    closeCategoryPopover,
  ]);

  // --- Filter Popover Handlers (Need state access) ---
  // State for selected filters (needed for FilterPopoverContent)
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");

  // Initialize filter state from URL (only needed if filters applied outside popover initially)
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

  // Handlers for filter changes within the popover
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
    console.log("[DEBUG] handleCountrySelect called with:", countryCode);
    setSelectedCountry((prev) => {
      const newValue = prev === countryCode ? "" : countryCode;
      console.log(
        "[DEBUG] selectedCountry changing from",
        prev,
        "to",
        newValue
      );
      return newValue;
    });
  };

  // Helper function to update URL and clear cache when clearing a filter
  const clearFilterAndNavigate = (paramToClear: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    const currentSelectedGenres =
      paramToClear === "with_genres" ? [] : selectedGenres;
    const currentSelectedYear = paramToClear === "year" ? "" : selectedYear;
    const currentSelectedCountry =
      paramToClear === "with_origin_country" ? "" : selectedCountry;

    newParams.delete(paramToClear);

    // Check if other filters remain active after clearing this one
    const genreParam = newParams.get("with_genres");
    const yearParam = newParams.get("year");
    const countryParam = newParams.get("with_origin_country");
    const otherFiltersActive = genreParam || yearParam || countryParam;

    // If no other filters are active after clearing, remove sort_by as well
    if (!otherFiltersActive) {
      newParams.delete("sort_by");
    }

    // Reset page and clear session cache
    newParams.delete("page");
    Object.values(STORAGE_KEYS).forEach((key) => {
      if (key !== STORAGE_KEYS.FROM_DISCOVER) sessionStorage.removeItem(key);
    });
    newParams.set("t", Date.now().toString()); // Bust cache

    console.log(
      `[DEBUG] Clearing filter '${paramToClear}', navigating with params:`,
      newParams.toString()
    );
    router.push(`/discover?${newParams.toString()}`, { scroll: false });

    // No need to close popover here, let the user continue filtering if they want
    // closeFilterPopover();
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

  const applyFiltersFromPopover = () => {
    console.log("[DEBUG] applyFiltersFromPopover called. Filter state:", {
      genres: selectedGenres,
      year: selectedYear,
      country: selectedCountry,
    });

    // Start with fresh URLSearchParams, ignoring previous category params like 'trending' or specific 'year'
    const newParams = new URLSearchParams();

    // Apply filters selected in the popover
    if (selectedGenres.length > 0) {
      newParams.set("with_genres", selectedGenres.join(","));
    }
    if (selectedYear) {
      // This year comes from the popover state
      newParams.set("year", selectedYear);
    }
    if (selectedCountry) {
      newParams.set("with_origin_country", selectedCountry);
    }

    // Add default sorting if any filter is applied
    if (selectedGenres.length > 0 || selectedYear || selectedCountry) {
      newParams.set("sort_by", "popularity.desc");
    } // Otherwise, no sort param is needed (defaults to TMDB default)

    // Copy essential non-filter params from current URL (size, gap)
    const essentialKeys = ["size", "gap"];
    searchParams.forEach((value, key) => {
      if (essentialKeys.includes(key)) {
        newParams.set(key, value);
      }
    });

    // Add cache buster
    newParams.set("t", Date.now().toString());

    console.log(
      "[DEBUG] Applying filters (resetting category) with URL params:",
      newParams.toString()
    );

    // Reset page and clear session cache (important!)
    Object.values(STORAGE_KEYS).forEach((key) => {
      if (key !== STORAGE_KEYS.FROM_DISCOVER) sessionStorage.removeItem(key);
    });
    // Note: We don't set page=1 here, navigation to new params implies starting from page 1

    router.push(`/discover?${newParams.toString()}`, { scroll: false });
    closeFilterPopover(); // Close popover after applying
  };

  // Инициализация posterSize и gapSize при монтировании
  useEffect(() => {
    let initialSize: PosterSize = "medium"; // Default
    let initialGap: GapSize = "m"; // Default

    try {
      // 1. Проверяем localStorage
      const storedSize = localStorage.getItem(
        DISCOVER_SETTINGS_POSTER_SIZE_KEY
      );
      const storedGap = localStorage.getItem(DISCOVER_SETTINGS_GAP_SIZE_KEY);

      if (storedSize && ["small", "medium", "large"].includes(storedSize)) {
        initialSize = storedSize as PosterSize;
      } else {
        // 2. Если в localStorage нет, проверяем URL
        const sizeParam = searchParams.get("size");
        if (sizeParam && ["small", "medium", "large"].includes(sizeParam)) {
          initialSize = sizeParam as PosterSize;
          // Сохраняем значение из URL в localStorage для будущих сессий
          localStorage.setItem(DISCOVER_SETTINGS_POSTER_SIZE_KEY, initialSize);
        }
      }

      if (storedGap && ["m", "l", "xl"].includes(storedGap)) {
        initialGap = storedGap as GapSize;
      } else {
        // 2. Если в localStorage нет, проверяем URL
        const gapParam = searchParams.get("gap");
        if (gapParam && ["m", "l", "xl"].includes(gapParam)) {
          initialGap = gapParam as GapSize;
          // Сохраняем значение из URL в localStorage
          localStorage.setItem(DISCOVER_SETTINGS_GAP_SIZE_KEY, initialGap);
        }
      }
    } catch (error) {
      console.error("Error reading settings from localStorage:", error);
      // В случае ошибки используем URL или дефолтные значения (логика выше уже это покрывает)
    }

    setPosterSize(initialSize);
    setGapSize(initialGap);

    // Обновляем URL, если он не соответствует установленным значениям (из localStorage или дефолтным)
    // Это нужно, чтобы URL всегда отражал текущие настройки
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

    if (urlNeedsUpdate) {
      router.replace(`${pathname}?${currentParams.toString()}`, {
        scroll: false,
      });
    }
  }, []); // Запускаем только один раз при монтировании

  // Ref для элемента-наблюдателя в конце списка
  const observer = useRef<IntersectionObserver | null>(null);
  // Ref для контейнера с прокруткой
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Ref для последнего элемента в списке фильмов
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

  // Добавляем логирование текущего скролла
  useEffect(() => {
    const logScrollPosition = () => {
      console.log(`[SCROLL DEBUG] Текущая позиция: ${window.scrollY}px`);
    };

    // Логируем только каждые 500ms, чтобы не загромождать консоль
    const throttledLogScroll = throttle(logScrollPosition, 500);

    window.addEventListener("scroll", throttledLogScroll);

    // Добавляем обработчик для события popstate (нажатие кнопки "назад" в браузере)
    const handlePopState = () => {
      console.log(
        "[SCROLL POPSTATE] Обработка события popstate (навигация назад/вперед)"
      );

      // Устанавливаем флаг FROM_DISCOVER если мы возвращаемся со страницы фильма
      // Это нужно, так как при навигации назад флаг может быть уже удален
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

  // Сохранение состояния при переходе на другую страницу
  useEffect(() => {
    // Функция для сохранения состояния
    const saveState = () => {
      try {
        const scrollPosition = window.scrollY;
        // Сохраняем текущие фильмы
        sessionStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(movies));
        // Сохраняем текущую страницу
        sessionStorage.setItem(STORAGE_KEYS.PAGE, page.toString());
        // Сохраняем флаг наличия дополнительных страниц
        sessionStorage.setItem(STORAGE_KEYS.HAS_MORE, hasMore.toString());
        // Сохраняем текущую позицию прокрутки
        sessionStorage.setItem(
          STORAGE_KEYS.SCROLL_POSITION,
          scrollPosition.toString()
        );
        // Добавляем флаг, что переход был на страницу фильма
        sessionStorage.setItem(STORAGE_KEYS.FROM_DISCOVER, "true");
        // Сохраняем текущий путь
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
      } catch (error) {
        console.error("Ошибка при сохранении состояния:", error);
      }
    };

    // Добавляем обработчик события beforeunload для сохранения состояния
    window.addEventListener("beforeunload", saveState);

    // Также сохраняем состояние при клике на фильм
    const handleLinkClick = () => {
      console.log("[SCROLL SAVE] Сохранение при клике на фильм");
      saveState();
    };

    // Находим все ссылки на фильмы и добавляем обработчик
    const movieLinks = document.querySelectorAll(".movie-card");
    console.log(
      `[SCROLL DEBUG] Найдено ${movieLinks.length} карточек фильмов для отслеживания кликов`
    );
    movieLinks.forEach((link) => {
      link.addEventListener("click", handleLinkClick);
    });

    return () => {
      window.removeEventListener("beforeunload", saveState);
      movieLinks.forEach((link) => {
        link.removeEventListener("click", handleLinkClick);
      });
    };
  }, [movies, page, hasMore, pathname, searchParams]);

  // Добавляем новый ref для отслеживания восстановления скролла
  const isScrollRestored = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Восстановление состояния при загрузке страницы
  useEffect(() => {
    // Проверяем, есть ли сохраненное состояние и возвращаемся ли мы с детальной страницы
    const savedMovies = sessionStorage.getItem(STORAGE_KEYS.MOVIES);
    const savedPage = sessionStorage.getItem(STORAGE_KEYS.PAGE);
    const savedScrollPosition = sessionStorage.getItem(
      STORAGE_KEYS.SCROLL_POSITION
    );
    // Используем ключ из STORAGE_KEYS
    const savedPath = sessionStorage.getItem(STORAGE_KEYS.LAST_VIEW);
    const currentPath = pathname + window.location.search;
    const fromDiscover = sessionStorage.getItem(STORAGE_KEYS.FROM_DISCOVER);

    // Получаем резервную копию из localStorage
    const backupScrollPosition = localStorage.getItem("backup_scroll_position");
    const backupPath = localStorage.getItem("backup_path");
    const backupMovieId = localStorage.getItem("backup_last_movie_id");
    const backupTimestamp = localStorage.getItem("backup_timestamp");

    // Выводим содержимое всего sessionStorage для отладки
    console.log(
      "[SCROLL DEBUG] Весь sessionStorage:",
      Object.fromEntries(
        [...Array(sessionStorage.length)].map((_, index) => {
          const key = sessionStorage.key(index);
          return key ? [key, sessionStorage.getItem(key)] : ["unknown", null];
        })
      )
    );

    console.log("[SCROLL DEBUG] Резервные данные из localStorage:", {
      backupScrollPosition,
      backupPath,
      backupMovieId,
      backupAge: backupTimestamp
        ? `${(Date.now() - parseInt(backupTimestamp || "0")) / 1000}s ago`
        : "n/a",
    });

    console.log("[SCROLL DEBUG] Проверка сохраненного состояния:", {
      hasSavedMovies: !!savedMovies,
      hasSavedPage: !!savedPage,
      savedScrollPosition,
      savedPath,
      currentPath,
      isSamePath: savedPath === currentPath,
      fromDiscover,
    });

    // Определяем, имеет ли смысл восстанавливать состояние
    let shouldRestore = false;
    let finalScrollPosition: string | null = null;

    // Сначала проверяем данные из sessionStorage
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
    }
    // Если нет подходящих данных в sessionStorage, проверяем localStorage
    else if (
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
        // 5 минут
        shouldRestore = true;
        finalScrollPosition = backupScrollPosition;

        // Если используем бэкап, восстанавливаем необходимые флаги в sessionStorage
        sessionStorage.setItem(STORAGE_KEYS.FROM_DISCOVER, "true");
        console.log("[SCROLL DEBUG] Восстановлен флаг FROM_DISCOVER из бэкапа");
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

    // Если решили восстанавливать
    if (shouldRestore && finalScrollPosition) {
      console.log("[SCROLL RESTORE] Восстанавливаем состояние:");

      // Устанавливаем флаг, чтобы предотвратить перезагрузку фильмов
      isScrollRestored.current = true;

      // Восстанавливаем данные
      try {
        if (savedMovies) {
          const parsedMovies = JSON.parse(savedMovies);
          if (Array.isArray(parsedMovies)) {
            setMovies(parsedMovies as DiscoverMovie[]); // Приводим к типу DiscoverMovie[]
            console.log(
              `[SCROLL RESTORE] Восстановлено ${parsedMovies.length} фильмов`
            );
          } else {
            console.warn("Сохраненные фильмы имеют неверный формат");
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
        console.error("Ошибка парсинга сохраненных фильмов:", e);
        setMovies([]);
      }

      // Восстанавливаем позицию прокрутки с большей задержкой
      const scrollToPosition = parseInt(finalScrollPosition);
      console.log(
        `[SCROLL RESTORE] Восстанавливаем прокрутку к позиции: ${scrollToPosition}px`
      );

      // Очищаем предыдущий таймер, если он существует
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Важно: НЕ удаляем FROM_DISCOVER пока не восстановится скролл
      console.log(
        "[SCROLL RESTORE] Сохраняем флаг FROM_DISCOVER до восстановления скролла"
      );

      // Используем увеличенное время задержки, чтобы контент успел отрендериться
      scrollTimeoutRef.current = setTimeout(() => {
        console.log(
          `[SCROLL RESTORE] Выполняем scrollTo(0, ${scrollToPosition})`
        );
        window.scrollTo({
          top: scrollToPosition,
          behavior: "auto",
        });

        // Добавляем дополнительную проверку после скролла
        setTimeout(() => {
          console.log(
            `[SCROLL RESTORE] Текущая позиция после восстановления: ${window.scrollY}px`
          );
          if (Math.abs(window.scrollY - scrollToPosition) > 100) {
            console.log(
              `[SCROLL RESTORE] Позиция скролла не совпадает, повторяем scrollTo(0, ${scrollToPosition})`
            );
            window.scrollTo({
              top: scrollToPosition,
              behavior: "auto",
            });
          }

          // Теперь, когда скролл завершен, можно очистить FROM_DISCOVER
          // Но мы оставляем его, чтобы избежать проблем с двойной обработкой
          console.log(
            "[SCROLL RESTORE] Скролл восстановлен, НЕ очищаем флаг FROM_DISCOVER"
          );
        }, 100);

        setIsRestoringState(false);
      }, 500); // Увеличиваем задержку с 300 до 500 мс
    } else {
      // Если мы пришли на новую страницу или нет сохраненного состояния,
      // очищаем sessionStorage и начинаем загрузку с начала
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

  // Загрузка фильмов при изменении страницы или параметров
  useEffect(() => {
    // Если мы восстанавливаем состояние, пропускаем загрузку
    if (isRestoringState) {
      console.log("[EFFECT FETCH] Skipping fetch during restore state");
      return;
    }

    const fetchMovies = async () => {
      console.log(`[EFFECT FETCH] Fetching movies for page ${page}...`);
      // Если это первая страница, показываем основной индикатор загрузки
      // Иначе показываем индикатор загрузки дополнительных фильмов
      if (page === 1) {
        setIsLoading(true);
        // Не нужно очищать movies здесь, если параметры изменились,
        // это должно делаться в другом useEffect, отслеживающем параметры
        // setMovies([]);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      try {
        // Используем searchParams из зависимостей для формирования запроса
        const currentParams = new URLSearchParams(searchParams.toString());
        currentParams.set("page", page.toString());

        // Логируем параметры для отладки
        console.log(
          `[EFFECT FETCH] Fetching page ${page} with params:`,
          Object.fromEntries(currentParams.entries())
        );

        const response = await fetch(
          `/api/discover?${currentParams.toString()}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Ошибка API: ${response.status}, Текст: ${errorText}`);
          throw new Error(`Ошибка получения фильмов: ${response.status}`);
        }

        // Указываем тип для data (можно создать более строгий интерфейс для API ответа)
        const data: { results: any[]; page: number; total_pages: number } =
          await response.json();

        if (!data.results || !Array.isArray(data.results)) {
          console.error("Неверный формат данных:", data);
          throw new Error("Неверный формат данных от API");
        }

        // Приводим результаты к типу DiscoverMovie[] и удаляем дубликаты
        const newMovies: DiscoverMovie[] = data.results.map(
          (item) => item as DiscoverMovie
        );
        const deduplicatedResults = Array.from(
          new Map(
            newMovies.map((movie: DiscoverMovie) => [movie.id, movie])
          ).values()
        );

        // Обновляем список фильмов, обеспечивая правильный тип возвращаемого значения
        setMovies((prevMovies: DiscoverMovie[]): DiscoverMovie[] => {
          if (page === 1) {
            return deduplicatedResults;
          } else {
            // Создаем Map из всех фильмов (существующих и новых)
            const allMoviesMap = new Map<number, DiscoverMovie>(
              [...prevMovies, ...deduplicatedResults].map((movie) => [
                movie.id,
                movie,
              ])
            );
            // Преобразуем Map обратно в массив
            return Array.from(allMoviesMap.values());
          }
        });

        // Проверяем, есть ли еще страницы
        setHasMore(data.page < data.total_pages);

        console.log(
          `Загружено ${data.results.length} фильмов, страница ${data.page} из ${data.total_pages}`
        );
      } catch (error: unknown) {
        // Обрабатываем unknown
        console.error("Ошибка при загрузке фильмов:", error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Произошла неизвестная ошибка при загрузке фильмов");
        }
      } finally {
        // Ставим isLoading в false только если это была загрузка первой страницы
        if (page === 1) setIsLoading(false);
        setIsLoadingMore(false);
        console.log(`[EFFECT FETCH] Fetching finished for page ${page}.`);
      }
    };

    fetchMovies();
  }, [page, isRestoringState, searchParams]);

  // Отдельный useEffect для сброса состояния при смене *фильтров* (не страницы)
  useEffect(() => {
    // Не сбрасывать при первоначальном рендере или восстановлении состояния
    if (isRestoringState) {
      // После первого рендера, когда восстановление закончено (или не требовалось)
      // сбрасываем флаг, чтобы следующие изменения параметров вызывали перезагрузку
      const timer = setTimeout(() => setIsRestoringState(false), 0);
      return () => clearTimeout(timer);
    }

    // Собираем только параметры фильтрации (исключая page, t, size, gap)
    const filterParams = new URLSearchParams();
    const relevantKeys = [
      "with_genres",
      "year",
      "with_origin_country",
      "trending",
      "sort_by",
      "query",
    ]; // Добавьте другие, если нужно
    searchParams.forEach((value, key) => {
      if (relevantKeys.includes(key)) {
        filterParams.set(key, value);
      }
    });
    const currentFilterString = filterParams.toString();

    // Сравниваем с предыдущими параметрами
    if (currentFilterString !== lastParams.current) {
      console.log("[EFFECT PARAMS] Filter params changed! Resetting state.", {
        prev: lastParams.current,
        current: currentFilterString,
      });
      lastParams.current = currentFilterString;

      // Сбрасываем состояние для новой загрузки (кроме isRestoringState)
      setPage(1); // Важно: это вызовет повторный запуск fetch-эффекта
      setMovies([]); // Очищаем фильмы сразу
      setIsLoading(true); // Показываем главный лоадер
      setHasMore(true);
      setError(null);
      // Очищаем кеш sessionStorage только при явном изменении фильтров
      Object.values(STORAGE_KEYS).forEach((key) => {
        if (key !== STORAGE_KEYS.FROM_DISCOVER) sessionStorage.removeItem(key);
      });
    } else {
      console.log(
        "[EFFECT PARAMS] Filter params did not change.",
        currentFilterString
      );
    }

    // Зависит только от searchParams, чтобы отлавливать изменения фильтров
    // НЕ зависит от isRestoringState, чтобы сравнение работало корректно
  }, [searchParams]);

  // Сохраняем текущий путь при первой загрузке
  useEffect(() => {
    // Сохраняем текущий путь, чтобы знать, куда мы вернулись
    const currentPath = pathname + window.location.search;
    sessionStorage.setItem(STORAGE_KEYS.LAST_VIEW, currentPath);
    console.log("[SCROLL PATH] Сохранен текущий путь:", currentPath);

    // НЕ очищаем FROM_DISCOVER здесь, чтобы не нарушить восстановление скролла

    // Очистка при размонтировании - теперь не очищаем FROM_DISCOVER
    return () => {
      console.log("[SCROLL PATH] Компонент DiscoverContent размонтирован");
      // НЕ вызываем handleRouteChange() чтобы избежать раннего удаления FROM_DISCOVER
    };
  }, [pathname, searchParams]);

  // Компонент карточки фильма для отображения
  const MovieCard = ({
    movie,
    index,
    isLastElement,
  }: {
    movie: DiscoverMovie;
    index: number;
    isLastElement: boolean;
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

    return (
      <div className="relative group">
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
          ref={isLastElement ? lastMovieElementRef : null}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => {
            playSound("choose.mp3");
            // Логика сохранения состояния и т.д. (оставляем как было)
            const currentScrollY = window.scrollY;
            const currentPath = pathname + window.location.search;
            try {
              sessionStorage.setItem(
                STORAGE_KEYS.MOVIES,
                JSON.stringify(movies)
              );
              sessionStorage.setItem(STORAGE_KEYS.PAGE, page.toString());
              sessionStorage.setItem(STORAGE_KEYS.HAS_MORE, hasMore.toString());
              sessionStorage.setItem(
                STORAGE_KEYS.SCROLL_POSITION,
                currentScrollY.toString()
              );
              sessionStorage.setItem(STORAGE_KEYS.LAST_VIEW, currentPath);
              sessionStorage.setItem(STORAGE_KEYS.FROM_DISCOVER, "true");
              localStorage.setItem(
                "backup_scroll_position",
                currentScrollY.toString()
              );
              localStorage.setItem("backup_path", currentPath);
              localStorage.setItem("backup_last_movie_id", movie.id.toString());
              localStorage.setItem("backup_timestamp", Date.now().toString());
            } catch (error) {
              console.error(
                "[SCROLL CLICK] Ошибка при сохранении состояния:",
                error
              );
            }
          }}
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
          <h3 className="text-sm font-medium truncate px-1 mt-1">
            {movie.title || movie.name}
          </h3>
        )}
        {showTitles && year && (
          <p className="text-xs text-gray-400 px-1">{year}</p>
        )}
      </div>
    );
  };

  // Функция для получения классов сетки в зависимости от размера (СКОРРЕКТИРОВАННЫЕ РАЗМЕРЫ)
  const getGridClasses = (size: PosterSize, gap: GapSize): string => {
    // Определяем класс row-gap в зависимости от выбранного размера промежутка
    let gapClass = "";
    switch (gap) {
      case "m":
        gapClass = "gap-x-2 gap-y-4"; // Средний
        break;
      case "l":
        gapClass = "gap-x-2 gap-y-8"; // Большой
        break;
      case "xl":
        gapClass = "gap-x-2 gap-y-24"; // Очень большой
        break;
      default:
        gapClass = "gap-x-2 gap-y-4"; // По умолчанию средний
    }

    // Определяем базовый класс сетки в зависимости от размера карточек
    let baseClass = "";
    switch (size) {
      case "small": // Самый мелкий размер
        baseClass =
          "grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-9 2xl:grid-cols-10";
        break;
      case "medium": // Размер текущего "small"
        baseClass =
          "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9";
        break;
      case "large": // Размер текущего "medium"
        baseClass =
          "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7";
        break;
      default: // По умолчанию средний (как текущий "small")
        baseClass =
          "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9";
    }

    return `${baseClass} ${gapClass}`;
  };

  // Restore handlers for size and gap changes
  // Функция для обновления размера постеров и URL
  const handleSizeChange = (newSize: PosterSize) => {
    setPosterSize(newSize);
    const params = new URLSearchParams(searchParams.toString());
    params.set("size", String(newSize));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    try {
      localStorage.setItem(DISCOVER_SETTINGS_POSTER_SIZE_KEY, newSize);
    } catch (error) {
      console.error("Error writing posterSize to localStorage:", error);
    }
  };

  // Функция для обновления размера промежутка и URL
  const handleGapChange = (newGap: GapSize) => {
    setGapSize(newGap);
    const params = new URLSearchParams(searchParams.toString());
    params.set("gap", String(newGap));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    try {
      localStorage.setItem(DISCOVER_SETTINGS_GAP_SIZE_KEY, newGap);
    } catch (error) {
      console.error("Error writing gapSize to localStorage:", error);
    }
  };

  return (
    <div className="min-h-screen text-white">
      <Header />
      <main className="px-6 pt-24 pb-8">
        <div className="max-w-full mx-auto">
          {/* Новый контейнер для заголовка и панели фильтров */}
          <div className="flex justify-between items-center mb-6">
            {/* Заголовок слева */}
            <div className="flex-grow mr-4">
              {" "}
              {/* Добавим отступ справа */}
              <DynamicHeading />
            </div>
            {/* Панель фильтров справа (убираем центрирующую обертку) */}
            <DiscoverFilterBar
              posterSize={posterSize}
              onSizeChange={handleSizeChange}
              gapSize={gapSize}
              onGapChange={handleGapChange}
              categoryTriggerRef={categoryTriggerRef}
              onOpenCategoryPopover={openCategoryPopover}
              filterTriggerRef={filterTriggerRef}
              onOpenFilterPopover={openFilterPopover}
            />
          </div>

          {/* Grid rendering logic */}
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
            <div className={getGridClasses(posterSize, gapSize)}>
              {movies.map((movie, index) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  index={index}
                  isLastElement={index === movies.length - 1}
                />
              ))}
            </div>
          )}
          {/* Loading more indicator */}
          {isLoadingMore && (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
            </div>
          )}
        </div>

        {/* Render Popovers Outside the main flow, positioned absolutely */}
        {isCategoryPopoverOpen && popoverPosition && (
          <div
            ref={categoryPopoverRef}
            className={clsx(
              "absolute z-[999]", // Use high z-index
              {
                "animate-slideDown": !isCategoryClosing,
                "animate-slideUp": isCategoryClosing,
              }
            )}
            style={{
              top: `${popoverPosition.top}px`,
              left: `${popoverPosition.left}px`,
            }}
          >
            <CategoryPopoverContent onClose={closeCategoryPopover} />
          </div>
        )}

        {isFilterPopoverOpen && popoverPosition && (
          <div
            ref={filterPopoverRef}
            className={clsx(
              "absolute z-[999]", // Use high z-index
              {
                "animate-slideDown": !isFilterClosing,
                "animate-slideUp": isFilterClosing,
              }
            )}
            style={{
              top: `${popoverPosition.top}px`,
              right: `${popoverPosition.right}px`,
            }}
          >
            {/* Pass filter state and handlers */}
            <FilterPopoverContent
              genres={genres} // Need to define or import genres/years/countries here
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
              onApplyFilters={applyFiltersFromPopover}
            />
          </div>
        )}
      </main>
    </div>
  );
}

// Define filter data (genres, years, countries) here or import them
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
