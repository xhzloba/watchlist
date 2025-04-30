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

// Больше не используем localStorage для размера
// const SETTINGS_POSTER_SIZE_KEY = "settings_poster_size";

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

  // Получаем и устанавливаем параметры из URL при первой загрузке
  // и при изменении searchParams
  useEffect(() => {
    // Получаем размер постеров из URL
    const size = searchParams.get("size");
    if (size && ["small", "medium", "large"].includes(size)) {
      setPosterSize(size as PosterSize);
    }

    // Получаем размер промежутка из URL
    const gap = searchParams.get("gap");
    if (gap && ["m", "l", "xl"].includes(gap)) {
      setGapSize(gap as GapSize);
    }
  }, [searchParams]);

  // Инициализируем состояние значением из URL
  const [posterSize, setPosterSize] = useState<PosterSize>("medium");

  // Инициализируем состояние размера промежутка
  const [gapSize, setGapSize] = useState<GapSize>("m");

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

  // Модифицируем useEffect для отслеживания ВСЕХ параметров фильтрации
  useEffect(() => {
    // Если это восстановление скролла, пропускаем перезагрузку фильмов
    if (isScrollRestored.current) {
      console.log(
        "[SCROLL DEBUG] Пропускаем перезагрузку фильмов при восстановлении скролла"
      );
      isScrollRestored.current = false;
      return;
    }

    // Параметры из URL, которые влияют на список фильмов
    const trending = searchParams.get("trending");
    const sortBy = searchParams.get("sort_by");
    const withGenres = searchParams.get("with_genres");
    const year = searchParams.get("year");
    const country = searchParams.get("with_origin_country");
    // НЕ включаем 'size' и 't' в отслеживаемые параметры

    // Собираем все значимые параметры в строку для сравнения
    const currentFilterParams = JSON.stringify({
      trending,
      sortBy,
      withGenres,
      year,
      country,
    });

    console.log("Значимые параметры URL изменились:", {
      trending,
      sortBy,
      withGenres,
      year,
      country,
    });

    // Если параметры фильтрации изменились, сбрасываем состояние и загружаем заново
    if (currentFilterParams !== lastParams.current) {
      console.log(
        "Обнаружены изменения в параметрах фильтрации, перезагружаем фильмы"
      );
      lastParams.current = currentFilterParams;

      // Очищаем сохраненное состояние, чтобы избежать восстановления старых данных
      Object.values(STORAGE_KEYS).forEach((key) => {
        sessionStorage.removeItem(key);
      });

      // Сбрасываем состояние для новой загрузки
      setPage(1);
      setMovies([]);
      setIsLoading(true);
      setHasMore(true);
      setError(null);
      setIsRestoringState(false); // Убедимся, что не пытаемся восстановить состояние
    }
  }, [pathname, searchParams]); // Зависим от pathname и searchParams

  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Функция для обновления размера постеров и URL
  const handleSizeChange = (newSize: PosterSize) => {
    // Обновляем состояние
    setPosterSize(newSize);

    // Обновляем URL - создаем новый объект URLSearchParams
    const params = new URLSearchParams();

    // Копируем все существующие параметры
    for (const [key, value] of Array.from(searchParams.entries())) {
      if (key !== "size") {
        params.set(key, value);
      }
    }

    // Добавляем size параметр
    params.set("size", String(newSize));

    // Используем router.replace для обновления URL без перезагрузки
    // и без добавления новой записи в историю браузера
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Функция для обновления размера промежутка и URL
  const handleGapChange = (newGap: GapSize) => {
    // Обновляем состояние
    setGapSize(newGap);

    // Обновляем URL - создаем новый объект URLSearchParams
    const params = new URLSearchParams();

    // Копируем все существующие параметры
    for (const [key, value] of Array.from(searchParams.entries())) {
      if (key !== "gap") {
        params.set(key, value);
      }
    }

    // Добавляем gap параметр
    params.set("gap", String(newGap));

    // Используем router.replace для обновления URL без перезагрузки
    // и без добавления новой записи в историю браузера
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Загрузка фильмов при изменении страницы
  useEffect(() => {
    // Если мы восстанавливаем состояние, пропускаем загрузку
    if (isRestoringState) {
      return;
    }

    const fetchMovies = async () => {
      // Если это первая страница, показываем основной индикатор загрузки
      // Иначе показываем индикатор загрузки дополнительных фильмов
      if (page === 1) {
        setIsLoading(true);
        setMovies([]);
      } else {
        setIsLoadingMore(true);
      }

      try {
        // Получаем текущие параметры из URL
        const currentParams = new URLSearchParams(window.location.search);
        // Добавляем номер страницы к параметрам
        currentParams.set("page", page.toString());

        // Логируем параметры для отладки
        console.log(
          `Загрузка фильмов, страница ${page}, параметры:`,
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
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    };

    fetchMovies();
  }, [page, isRestoringState, searchParams]);

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
          className={`movie-card block relative group ${
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
          <div
            className={`relative aspect-[2/3] ${
              roundedCorners ? "rounded-xl" : "rounded-md"
            } overflow-hidden w-full h-full`}
          >
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

  return (
    <div className="min-h-screen text-white">
      <Header />
      <main className="px-6 pt-24 pb-8">
        <div className="max-w-full mx-auto">
          {/* Оборачиваем заголовок и слайдер во flex-контейнер */}
          <div className="flex justify-between items-center mb-8">
            {/* Заголовок */}
            <div className="flex-grow">
              <DynamicHeading />
            </div>

            {/* Выбор размера вертикального промежутка - СКРЫТ на мобильных */}
            <div className="hidden md:flex items-center gap-2 mr-4 flex-shrink-0">
              <span className="text-xs text-gray-400">
                Вертикальный промежуток:
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => handleGapChange("m")}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${
                    gapSize === "m"
                      ? "bg-yellow-500 text-black font-medium"
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  }`}
                >
                  M
                </button>
                <button
                  onClick={() => handleGapChange("l")}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${
                    gapSize === "l"
                      ? "bg-yellow-500 text-black font-medium"
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  }`}
                >
                  L
                </button>
                <button
                  onClick={() => handleGapChange("xl")}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${
                    gapSize === "xl"
                      ? "bg-yellow-500 text-black font-medium"
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  }`}
                >
                  XL
                </button>
              </div>
            </div>

            {/* Слайдер размера постеров - ВИДЕН всегда, но ЛЕЙБЛЫ скрыты на мобильных */}
            {/* Делаем gap одинаковым: gap-3 */}
            {/* Устанавливаем ширину: 80px по умолчанию, w-48 (192px) на md+ */}
            <div className="flex items-center gap-3 flex-shrink-0 w-[80px] md:w-48">
              {/* ЛЕЙБЛ "Размер:" СКРЫТ на мобильных */}
              <label
                htmlFor="poster-size-slider"
                className="hidden md:inline text-xs text-gray-400 whitespace-nowrap"
              >
                Размер:
              </label>
              <input
                id="poster-size-slider"
                type="range"
                min="0" // 0: small, 1: medium, 2: large
                max="2"
                step="1"
                value={
                  posterSize === "small" ? 0 : posterSize === "medium" ? 1 : 2
                }
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  const newSize =
                    value === 0 ? "small" : value === 1 ? "medium" : "large";
                  // Используем функцию handleSizeChange вместо просто setPosterSize
                  handleSizeChange(newSize);
                }}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                title={`Размер постеров: ${
                  posterSize === "small"
                    ? "Мелкий"
                    : posterSize === "medium"
                    ? "Средний"
                    : "Крупный"
                }`}
              />
              {/* Отображение текущего размера - СКРЫТО на мобильных */}
              <span className="hidden md:inline text-xs font-medium text-gray-300 w-14 text-right">
                {posterSize === "small" && "Мелкий"}
                {posterSize === "medium" && "Средний"}
                {posterSize === "large" && "Крупный"}
              </span>
            </div>
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

          {isLoadingMore && (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

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
