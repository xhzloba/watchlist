"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import GradientBackground from "@/components/gradient-background";
import Header from "@/components/header";
import MovieCard from "@/components/movie-card";
import { Bookmark, BookmarkX, Library, Users, History } from "lucide-react";
import Link from "next/link";
import { playSound } from "@/lib/sound-utils";
import EmptyState from "@/components/empty-state";
import { useReleaseQualityVisibility } from "@/components/movie-card-wrapper";
import MovieRow from "@/components/movie-row";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { getImageUrl } from "@/lib/tmdb";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import Router from "next/router";
import NProgress from "nprogress";
import useMediaQuery from "@/hooks/use-media-query";

// Динамический импорт с отключенным SSR
const ViewingHistoryRow = dynamic(
  () => import("@/components/viewing-history-row"),
  { ssr: false }
);

// Интерфейс для фильма в избранном
interface WatchlistMovie {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string;
  vote_average?: number;
  overview: string;
  added_at?: number;
  is_watched?: boolean;
}

// Специальный компонент для отображения фильмов в медиатеке с кнопкой удаления
function WatchlistMovieRow({
  items,
  onRemove,
}: {
  items: WatchlistMovie[];
  onRemove: (id: number, e: React.MouseEvent) => void;
}) {
  const [roundedCorners, setRoundedCorners] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Эффект для отслеживания настройки закругленных углов
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRoundedCorners = localStorage.getItem(
        "settings_rounded_corners"
      );
      setRoundedCorners(savedRoundedCorners === "true");
    }

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

  return (
    <section className="relative">
      <div className="group relative">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-6 py-2 relative overflow-x-auto movie-row"
        >
          {items.map((item, index) => (
            <div
              key={`movie-${item.id || index}-${index}`}
              className="flex-none w-[230px] p-1 relative group/item"
            >
              {/* Кнопка удаления из избранного вынесена за пределы Link */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Предотвращаем активацию NextTopLoader
                  if (typeof window !== "undefined" && window.event) {
                    window.event.cancelBubble = true;
                  }
                  // Останавливаем текущий индикатор загрузки
                  NProgress.done();
                  NProgress.remove();
                  // Удаляем фильм
                  onRemove(item.id, e);
                  return false;
                }}
                className="absolute top-2 right-2 bg-black/70 p-2 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity z-20"
                title="Удалить из медиатеки"
              >
                <BookmarkX className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              </button>

              <Link
                href={`/movie/${item.id}`}
                onClick={() => playSound("choose.mp3")}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div
                    className={`relative ${
                      roundedCorners ? "rounded-xl" : "rounded-md"
                    } overflow-hidden mb-2 aspect-[2/3] transition-all duration-200 border-[3px] border-transparent hover:border-white`}
                  >
                    <Image
                      src={getImageUrl(item.poster_path, "w500")}
                      alt={item.title || ""}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h3 className="text-sm font-medium truncate">{item.title}</h3>
                  <p className="text-xs text-gray-400">
                    {item.release_date
                      ? new Date(item.release_date).getFullYear()
                      : ""}
                  </p>
                </motion.div>
              </Link>
            </div>
          ))}
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
    </section>
  );
}

// Специальный компонент для отображения актеров в слайдере
function SubscribedActorsRow({
  actors,
  onUnsubscribe,
}: {
  actors: any[];
  onUnsubscribe: (id: number, e: React.MouseEvent) => void;
}) {
  const [roundedCorners, setRoundedCorners] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Эффект для отслеживания настройки закругленных углов
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRoundedCorners = localStorage.getItem(
        "settings_rounded_corners"
      );
      setRoundedCorners(savedRoundedCorners === "true");
    }

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
    const scrollAmount = direction === "left" ? -300 : 300;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  return (
    <section className="relative">
      <div className="group relative">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-6 py-2 relative overflow-x-auto actor-row"
        >
          {actors.map((actor) => (
            <div
              key={`actor-${actor.id}`}
              className="flex-none w-[180px] p-1 relative group/item"
            >
              {/* Кнопка отписки */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onUnsubscribe(actor.id, e);
                  return false;
                }}
                className="absolute top-2 right-2 bg-black/70 p-2 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity z-20"
                title="Отписаться"
              >
                <BookmarkX className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              </button>

              <Link
                href={`/actors/${actor.id}`}
                onClick={() => playSound("choose.mp3")}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div
                    className={`relative rounded-full overflow-hidden mb-3 w-[170px] h-[170px] transition-all duration-200 border-[3px] border-transparent hover:border-white`}
                  >
                    <Image
                      src={getImageUrl(actor.profile_path, "w500")}
                      alt={actor.name || ""}
                      fill
                      sizes="170px"
                      quality={85}
                      className="object-cover"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-center truncate">
                    {actor.name}
                  </h3>
                </motion.div>
              </Link>
            </div>
          ))}
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
    </section>
  );
}

function WatchlistContent() {
  const [watchlistMovies, setWatchlistMovies] = useState<WatchlistMovie[]>([]);
  const [subscribedActors, setSubscribedActors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const { roundedCorners } = useReleaseQualityVisibility();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 767px)");

  // Создаем ключ для принудительного обновления компонента
  const [updateKey, setUpdateKey] = useState(Date.now());

  // Отслеживаем, была ли страница загружена через историю браузера
  const isFromHistory = useRef(false);

  // Функция загрузки списка избранного - всегда получает свежие данные из localStorage
  const loadWatchlist = (showLoader = true) => {
    console.log("Загрузка списка избранного...", Date.now());
    if (showLoader) {
      setIsLoading(true);
    }

    try {
      // Принудительно читаем актуальное состояние из localStorage
      const storedWatchlist = localStorage.getItem("watchlist");
      if (storedWatchlist) {
        const parsedWatchlist = JSON.parse(storedWatchlist);

        // Сортируем по времени добавления, новые вначале
        const sortedWatchlist = parsedWatchlist.sort(
          (a: WatchlistMovie, b: WatchlistMovie) => {
            // Если у фильма нет метки времени, считаем что он добавлен давно
            const timeA = a.added_at || 0;
            const timeB = b.added_at || 0;
            return timeB - timeA; // Сортировка по убыванию (новые вначале)
          }
        );

        setWatchlistMovies(sortedWatchlist);
      } else {
        console.log("Список избранного пуст");
        setWatchlistMovies([]);
      }

      // Загружаем подписки на актеров
      const actorsData = JSON.parse(
        localStorage.getItem("subscribed_actors") || "[]"
      );
      setSubscribedActors(actorsData);
    } catch (e) {
      console.error("Ошибка при загрузке списка избранного:", e);
      setWatchlistMovies([]);
    }
    setIsLoading(false);
    setIsLoaded(true);
  };

  // Этот эффект запускается при каждом обновлении ключа - на любые изменения или переходы
  useEffect(() => {
    loadWatchlist(true);
  }, [updateKey]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Устанавливаем мета-тег для отключения кэширования
      const metaNoCache = document.createElement("meta");
      metaNoCache.name = "Cache-Control";
      metaNoCache.content = "no-cache, no-store, must-revalidate";
      document.head.appendChild(metaNoCache);

      // Добавляем другие мета-теги для контроля кэширования
      const metaPragma = document.createElement("meta");
      metaPragma.name = "Pragma";
      metaPragma.content = "no-cache";
      document.head.appendChild(metaPragma);

      const metaExpires = document.createElement("meta");
      metaExpires.name = "Expires";
      metaExpires.content = "0";
      document.head.appendChild(metaExpires);

      // Проверяем, загружена ли страница через историю браузера
      if (performance && performance.navigation) {
        const navType = performance.navigation.type;
        // Тип 2 означает навигацию через историю (назад/вперед)
        if (navType === 2) {
          isFromHistory.current = true;
          console.log(
            "Страница загружена через историю браузера, принудительно обновляем"
          );
          // Вызываем принудительное обновление страницы
          window.location.reload();
        }
      }

      // Загружаем данные при монтировании
      loadWatchlist(true);

      // Прослушиваем пользовательское событие изменения списка избранного
      const handleWatchlistChange = () => {
        console.log("Обнаружено изменение списка избранного");
        // Обновляем ключ для полной перезагрузки компонента
        setUpdateKey(Date.now());
        // При изменениях списка избранного не показываем лоадер
        loadWatchlist(false);
      };

      // Обработчик для событий навигации по истории браузера (кнопки назад/вперед)
      const handlePopState = (event: PopStateEvent) => {
        console.log("Обнаружена навигация по истории браузера");
        // Проверяем, что мы всё ещё на странице медиатеки
        if (pathname === "/watchlist") {
          // Отменяем событие, чтобы предотвратить обычную навигацию по истории
          event.preventDefault();
          // Принудительная перезагрузка страницы вместо обновления состояния
          window.location.reload();
        }
      };

      // Обработчик для фокуса окна - обновляем данные при возврате на вкладку
      const handleFocus = () => {
        console.log("Окно получило фокус, обновляем данные");
        // Обновляем ключ для полной перезагрузки компонента
        setUpdateKey(Date.now());
        loadWatchlist(false);
      };

      // Добавляем слушатели событий
      document.addEventListener("watchlistChange", handleWatchlistChange);
      window.addEventListener("popstate", handlePopState);
      window.addEventListener("focus", handleFocus);

      // Прослушиваем событие storage (для синхронизации между вкладками)
      window.addEventListener("storage", (e) => {
        if (e.key === "watchlist") {
          console.log("Обнаружено изменение localStorage из другой вкладки");
          // Обновляем ключ для полной перезагрузки компонента
          setUpdateKey(Date.now());
          loadWatchlist(false);
        }
      });

      // Заменяем стандартное поведение кнопки "назад" браузера
      history.pushState = new Proxy(history.pushState, {
        apply: (
          target,
          thisArg,
          argumentsList: [
            data: any,
            unused: string,
            url?: string | URL | null | undefined
          ]
        ) => {
          const result = target.apply(thisArg, argumentsList);
          console.log("История изменена через pushState");
          return result;
        },
      });

      // Убираем слушатели при размонтировании
      return () => {
        document.removeEventListener("watchlistChange", handleWatchlistChange);
        window.removeEventListener("popstate", handlePopState);
        window.removeEventListener("focus", handleFocus);
        window.removeEventListener("storage", () => {});
        // Удаляем мета-теги
        document.head.removeChild(metaNoCache);
        document.head.removeChild(metaPragma);
        document.head.removeChild(metaExpires);
      };
    }
  }, [pathname]);

  // Функция для удаления фильма из избранного - обновляем напрямую localStorage
  const removeFromWatchlist = (movieId: number, e: React.MouseEvent) => {
    // Обязательно предотвращаем всплытие и стандартное поведение события
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Агрессивно останавливаем все возможные индикаторы загрузки
    if (typeof window !== "undefined") {
      NProgress.done(true);
      NProgress.remove();

      // Убираем элемент nprogress вручную, если он существует
      const nprogressElement = document.getElementById("nprogress");
      if (nprogressElement) {
        nprogressElement.style.display = "none";
        nprogressElement.remove();
      }
    }

    console.log("Удаление фильма из избранного:", movieId);
    try {
      // Получаем актуальные данные напрямую из localStorage
      const currentWatchlist = JSON.parse(
        localStorage.getItem("watchlist") || "[]"
      );
      const updatedWatchlist = currentWatchlist.filter(
        (movie: WatchlistMovie) => movie.id !== movieId
      );

      // Обновляем localStorage
      localStorage.setItem("watchlist", JSON.stringify(updatedWatchlist));
      console.log("Обновленный список избранного:", updatedWatchlist);

      // Обновляем состояние компонента
      setWatchlistMovies(updatedWatchlist);

      // Принудительно обновляем ключ для перезагрузки компонента
      setUpdateKey(Date.now());

      // Вызываем пользовательское событие изменения списка
      const event = new CustomEvent("watchlistChange", {
        detail: { timestamp: Date.now() },
      });
      document.dispatchEvent(event);

      // Убедимся, что класс loading удален с body после удаления фильма
      if (typeof document !== "undefined") {
        document.body.classList.remove("loading");
      }
    } catch (error) {
      console.error("Ошибка при удалении из избранного:", error);
    }
  };

  // Функция для отписки от актера
  const unsubscribeFromActor = (actorId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    playSound("remove.mp3");

    try {
      // Получаем текущий список подписок
      const subscribedActors = JSON.parse(
        localStorage.getItem("subscribed_actors") || "[]"
      );

      // Удаляем актера из списка
      const updatedActors = subscribedActors.filter(
        (actor: any) => actor.id !== actorId
      );

      // Сохраняем обновленный список
      localStorage.setItem("subscribed_actors", JSON.stringify(updatedActors));

      // Обновляем состояние
      setSubscribedActors(updatedActors);

      // Создаем событие для оповещения других компонентов
      document.dispatchEvent(new Event("actorSubscriptionChange"));
    } catch (error) {
      console.error("Ошибка при отписке от актера:", error);
    }
  };

  return (
    <div className="min-h-screen text-white">
      <Header />
      <main className="pt-32 pb-8 w-full">
        <div className="container-fluid mx-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
            </div>
          ) : isLoaded &&
            watchlistMovies.length === 0 &&
            subscribedActors.length === 0 ? (
            <EmptyState
              icon={<BookmarkX size={48} className="text-gray-400" />}
              title="Ваш список избранного пуст"
              description="Добавляйте фильмы в избранное, чтобы быстро вернуться к ним позже"
              actionText="Найти фильмы"
              actionLink="/discover"
            />
          ) : (
            <>
              {/* Фильтруем не просмотренные фильмы */}
              {watchlistMovies.filter((movie) => !movie.is_watched).length >
                0 && (
                <>
                  <div className="flex items-center gap-3 relative px-6 mb-4">
                    <Bookmark className="w-6 h-6 text-yellow-500" />
                    <h2 className="text-xl uppercase tracking-wide font-bebas-neue pb-2 pr-8 relative border-b border-transparent">
                      СМОТРЕТЬ ПОЗЖЕ
                      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent"></div>
                      <div className="absolute top-0 -right-0 bg-yellow-500 text-black w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono font-extrabold">
                        {
                          watchlistMovies.filter((movie) => !movie.is_watched)
                            .length
                        }
                      </div>
                    </h2>
                  </div>

                  {/* Условие рендеринга для НЕПРОСМОТРЕННЫХ */}
                  {isMobile || // Если мобильный, всегда слайдер
                  watchlistMovies.filter((movie) => !movie.is_watched).length >
                    7 ? ( // Иначе (десктоп) проверяем кол-во
                    /* Если мобильный ИЛИ фильмов больше 7 - отображаем в слайдере */
                    <div className="mb-16">
                      <WatchlistMovieRow
                        items={watchlistMovies.filter(
                          (movie) => !movie.is_watched
                        )}
                        onRemove={removeFromWatchlist}
                      />
                    </div>
                  ) : (
                    /* Иначе (десктоп и фильмов 7 или меньше) - отображаем в сетке */
                    <div className="flex flex-wrap gap-4 pl-6 pr-6 mb-16">
                      {watchlistMovies
                        .filter((movie) => !movie.is_watched)
                        .map((movie) => (
                          <div
                            key={movie.id}
                            className="relative group/item w-[200px]"
                          >
                            {/* Кнопка удаления из избранного */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // Предотвращаем активацию NextTopLoader
                                if (
                                  typeof window !== "undefined" &&
                                  window.event
                                ) {
                                  window.event.cancelBubble = true;
                                }
                                // Останавливаем текущий индикатор загрузки
                                NProgress.done();
                                NProgress.remove();
                                // Удаляем фильм
                                removeFromWatchlist(movie.id, e);
                                return false;
                              }}
                              className="absolute top-2 right-2 bg-black/70 p-2 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity z-20"
                              title="Удалить из медиатеки"
                            >
                              <BookmarkX className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            </button>

                            <Link
                              href={`/movie/${movie.id}`}
                              onClick={() => playSound("choose.mp3")}
                            >
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                              >
                                <div
                                  className={`relative ${
                                    roundedCorners ? "rounded-xl" : "rounded-md"
                                  } overflow-hidden mb-2 aspect-[2/3] transition-all duration-200 border-[3px] border-transparent hover:border-white`}
                                >
                                  <Image
                                    src={getImageUrl(movie.poster_path, "w500")}
                                    alt={movie.title || ""}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <h3 className="text-sm font-medium truncate">
                                  {movie.title}
                                </h3>
                                <p className="text-xs text-gray-400">
                                  {movie.release_date
                                    ? new Date(movie.release_date).getFullYear()
                                    : ""}
                                </p>
                              </motion.div>
                            </Link>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}

              {/* Добавляем обратно секцию просмотренных фильмов */}
              {watchlistMovies.filter((movie) => movie.is_watched).length >
                0 && (
                <>
                  <div className="flex items-center gap-3 relative px-6 mb-4">
                    <History className="w-6 h-6 text-yellow-500" />
                    <h2 className="text-xl uppercase tracking-wide font-bebas-neue pb-2 pr-8 relative border-b border-transparent">
                      ПРОСМОТРЕНО
                      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent"></div>
                      <div className="absolute top-0 -right-0 bg-yellow-500 text-black w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono font-extrabold">
                        {
                          watchlistMovies.filter((movie) => movie.is_watched)
                            .length
                        }
                      </div>
                    </h2>
                  </div>

                  {/* Условие рендеринга для ПРОСМОТРЕННЫХ */}
                  {isMobile || // Если мобильный, всегда слайдер
                  watchlistMovies.filter((movie) => movie.is_watched).length >
                    7 ? ( // Иначе (десктоп) проверяем кол-во
                    /* Если мобильный ИЛИ фильмов больше 7 - отображаем в слайдере */
                    <div className="mb-16">
                      <WatchlistMovieRow
                        items={watchlistMovies.filter(
                          (movie) => movie.is_watched
                        )}
                        onRemove={removeFromWatchlist}
                      />
                    </div>
                  ) : (
                    /* Иначе (десктоп и фильмов 7 или меньше) - отображаем в сетке */
                    <div className="flex flex-wrap gap-4 pl-6 pr-6 mb-16">
                      {watchlistMovies
                        .filter((movie) => movie.is_watched)
                        .map((movie) => (
                          <div
                            key={movie.id}
                            className="relative group/item w-[200px]"
                          >
                            {/* Кнопка удаления из избранного */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // Предотвращаем активацию NextTopLoader
                                if (
                                  typeof window !== "undefined" &&
                                  window.event
                                ) {
                                  window.event.cancelBubble = true;
                                }
                                // Останавливаем текущий индикатор загрузки
                                NProgress.done();
                                NProgress.remove();
                                // Удаляем фильм
                                removeFromWatchlist(movie.id, e);
                                return false;
                              }}
                              className="absolute top-2 right-2 bg-black/70 p-2 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity z-20"
                              title="Удалить из медиатеки"
                            >
                              <BookmarkX className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            </button>

                            <Link
                              href={`/movie/${movie.id}`}
                              onClick={() => playSound("choose.mp3")}
                            >
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                              >
                                <div
                                  className={`relative ${
                                    roundedCorners ? "rounded-xl" : "rounded-md"
                                  } overflow-hidden mb-2 aspect-[2/3] transition-all duration-200 border-[3px] border-transparent hover:border-white`}
                                >
                                  <Image
                                    src={getImageUrl(movie.poster_path, "w500")}
                                    alt={movie.title || ""}
                                    fill
                                    className="object-cover"
                                  />
                                  <div className="absolute bottom-0 right-0 m-1 bg-white text-black p-1 rounded-full">
                                    <svg
                                      aria-hidden="true"
                                      className="w-3 h-3"
                                      fill="currentColor"
                                      viewBox="0 0 48 48"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path d="M13.5 24.6195L21 32.121L34.5 18.6225L32.3775 16.5L21 27.879L15.6195 22.5L13.5 24.6195Z"></path>
                                    </svg>
                                  </div>
                                </div>
                                <h3 className="text-sm font-medium truncate">
                                  {movie.title}
                                </h3>
                                <p className="text-xs text-gray-400">
                                  {movie.release_date
                                    ? new Date(movie.release_date).getFullYear()
                                    : ""}
                                </p>
                              </motion.div>
                            </Link>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}

              {/* Отображение подписанных актеров */}
              {subscribedActors.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center gap-3 relative px-6 mb-4">
                    <Users className="w-6 h-6 text-yellow-500" />
                    <h2 className="text-xl uppercase tracking-wide font-bebas-neue pb-2 pr-8 relative border-b border-transparent">
                      ИЗБРАННЫЕ АКТЕРЫ
                      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent"></div>
                      <div className="absolute top-0 -right-0 bg-yellow-500 text-black w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono font-extrabold">
                        {subscribedActors.length}
                      </div>
                    </h2>
                  </div>

                  <SubscribedActorsRow
                    actors={subscribedActors}
                    onUnsubscribe={unsubscribeFromActor}
                  />
                </div>
              )}

              {/* История просмотров */}
              <div className="mt-16">
                <ViewingHistoryRow />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function WatchlistPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
        </div>
      }
    >
      <GradientBackground>
        <WatchlistContent />
      </GradientBackground>
    </Suspense>
  );
}
