"use client";

import { useEffect, useState, useRef, useMemo, memo } from "react";
import NextImage from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import type { Movie, Cast } from "@/lib/tmdb";
import { getImageUrl, getYear, getPersonMovieCredits } from "@/lib/tmdb";
import { playSound } from "@/lib/sound-utils";
import { useReleaseQualityVisibility } from "@/components/movie-card-wrapper";
import { X, User, ChevronLeft, ChevronRight } from "lucide-react";

// Утилита для перемешивания массива (Fisher-Yates shuffle)
function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length,
    randomIndex;
  const newArray = [...array]; // Создаем копию, чтобы не мутировать оригинал
  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // And swap it with the current element.
    [newArray[currentIndex], newArray[randomIndex]] = [
      newArray[randomIndex],
      newArray[currentIndex],
    ];
  }
  return newArray;
}

// === КОМПОНЕНТ УВЕДОМЛЕНИЯ ОБ АКТЕРАХ ===
interface ActorNotificationProps {
  actors: Cast[]; // Первые 8 актеров
  onClose: () => void;
  currentMovieId: number;
  topActorIds: number[]; // <-- Добавляем ID топ-3 актеров
}

const ActorNotification: React.FC<ActorNotificationProps> = memo(
  ({
    actors,
    onClose,
    currentMovieId,
    topActorIds /* <-- Получаем ID топ-3 */,
  }) => {
    const router = useRouter();
    const { roundedCorners } = useReleaseQualityVisibility();
    // Состояние для хранения ТОП N фильмов КАЖДОГО актера
    const [topMoviesPerActor, setTopMoviesPerActor] = useState<
      Record<number, Movie[]>
    >({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const fetchActorMovies = async () => {
        if (!actors || actors.length === 0) {
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);
        const moviesData: Record<number, Movie[]> = {};
        const moviesToFetch = 10; // Запрашиваем топ-10 фильмов

        try {
          const creditPromises = actors.map((actor) =>
            getPersonMovieCredits(actor.id)
              .then((credits) => {
                // 1. Сортируем по популярности ВСЕ фильмы актера
                const sortedMovies = credits.cast.sort(
                  (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)
                );

                // 2. Фильтруем текущий фильм
                const filteredMovies = sortedMovies.filter(
                  (m) => m.id !== currentMovieId
                );

                // 3. Берем топ-N (10) из отфильтрованного списка
                const topNMovies = filteredMovies.slice(0, moviesToFetch);

                return {
                  actorId: actor.id,
                  movies: topNMovies, // Сохраняем топ-10
                };
              })
              .catch((err) => {
                console.error(
                  `Ошибка загрузки фильмов для актера ${actor.id}:`,
                  err
                );
                return { actorId: actor.id, movies: [] };
              })
          );

          const results = await Promise.all(creditPromises);

          results.forEach((result) => {
            moviesData[result.actorId] = result.movies;
          });

          // Сохраняем топ-10 фильмов для каждого актера
          setTopMoviesPerActor(moviesData);
        } catch (err) {
          console.error("Общая ошибка загрузки фильмов актеров:", err);
          setError("Не удалось загрузить работы актеров.");
        } finally {
          setIsLoading(false);
        }
      };

      fetchActorMovies();
    }, [actors, currentMovieId]);

    // --- НОВАЯ ЛОГИКА useMemo ---
    const orderedAndShuffledMovies = useMemo(() => {
      if (isLoading || error || actors.length === 0) return [];

      const finalMovieList: { movie: Movie; actors: Cast[] }[] = [];
      const addedMovieIds = new Set<number>();

      // Функция для добавления фильма, если он еще не добавлен
      const addMovieIfNeeded = (movie: Movie, actor: Cast) => {
        if (!addedMovieIds.has(movie.id)) {
          finalMovieList.push({ movie, actors: [actor] }); // Начнем с одного актера, потом можно дополнить
          addedMovieIds.add(movie.id);
          return true; // Фильм добавлен
        }
        return false; // Фильм уже был
      };

      // Шаг 1: Обработка топ-3 актеров по порядку
      for (let i = 0; i < 3 && i < actors.length; i++) {
        const actor = actors[i];
        const actorMovies = topMoviesPerActor[actor.id] || [];
        let addedCountForThisActor = 0;
        for (const movie of actorMovies) {
          if (addMovieIfNeeded(movie, actor)) {
            addedCountForThisActor++;
            if (addedCountForThisActor >= 2) {
              break; // Добавили 2 фильма для этого актера
            }
          }
        }
      }

      // Шаг 2: Сбор и обработка фильмов остальных актеров (4-8)
      const remainingPotentialMovies: { movie: Movie; actor: Cast }[] = [];
      for (let i = 3; i < actors.length; i++) {
        const actor = actors[i];
        const actorMovies = topMoviesPerActor[actor.id] || [];
        actorMovies.forEach((movie) => {
          // Добавляем только те, которых еще нет в итоговом списке
          if (!addedMovieIds.has(movie.id)) {
            remainingPotentialMovies.push({ movie, actor });
          }
        });
      }

      // Создаем карту уникальных оставшихся фильмов
      const remainingMovieMap = new Map<
        number,
        { movie: Movie; actors: Cast[] }
      >();
      remainingPotentialMovies.forEach(({ movie, actor }) => {
        if (remainingMovieMap.has(movie.id)) {
          const existingEntry = remainingMovieMap.get(movie.id)!;
          if (!existingEntry.actors.some((a) => a.id === actor.id)) {
            existingEntry.actors.push(actor); // Добавляем доп. актера 4-8, если нужно
          }
        } else {
          // Добавляем только если фильм еще не в finalMovieList (на всякий случай)
          if (!addedMovieIds.has(movie.id)) {
            remainingMovieMap.set(movie.id, { movie: movie, actors: [actor] });
          }
        }
      });

      // Перемешиваем уникальные оставшиеся фильмы
      const shuffledOther = shuffleArray(
        Array.from(remainingMovieMap.values())
      );

      // Шаг 3: Объединяем и обрезаем до 16
      const combinedList = [...finalMovieList, ...shuffledOther];
      return combinedList.slice(0, 16);

      // Зависимости остаются прежними, так как topActorIds используется косвенно через actors
    }, [actors, topMoviesPerActor, isLoading, error]);

    if (isLoading) {
      return null;
    }

    // Используем orderedAndShuffledMovies для проверки и рендеринга
    if (error || orderedAndShuffledMovies.length === 0) {
      return null;
    }

    const handleMovieClick = (movieId: number) => {
      playSound("choose.mp3");
      onClose();
      router.push(`/movie/${movieId}`);
    };

    const scrollLeft = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
      }
    };

    const scrollRight = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, x: 100, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, scale: 0.9 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="fixed bottom-4 left-4 right-4 md:bottom-4 md:right-4 md:left-auto md:w-[580px] z-[70] 
                   bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 
                   rounded-2xl shadow-2xl border border-white/20 overflow-hidden text-white
                   backdrop-blur-lg before:absolute before:inset-0 before:bg-white/5 before:rounded-2xl
                   after:absolute after:inset-0 after:bg-gradient-to-br after:from-transparent after:via-white/5 after:to-transparent after:rounded-2xl"
        style={{
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 30px rgba(99, 102, 241, 0.3)",
        }}
      >
        {/* Glow эффект сверху */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-10 bg-gradient-to-b from-indigo-400/50 to-transparent blur-xl opacity-70"></div>

        <div className="relative z-10 p-3 border-b border-white/20 backdrop-blur-sm bg-white/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-lg">
              <User className="w-5 h-5 text-white drop-shadow-sm" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white drop-shadow-sm">
                Хиты с актерами фильма
              </h3>
              <p className="text-xs text-white/80">
                {orderedAndShuffledMovies.length} рекомендаций
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-all duration-300 p-2 rounded-full 
                     hover:bg-white/20 hover:scale-110 active:scale-95 backdrop-blur-sm
                     shadow-lg hover:shadow-xl"
            aria-label="Закрыть уведомление"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative z-10 p-3 group">
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto scrollbar-hide gap-3 pb-2 scroll-smooth"
          >
            {orderedAndShuffledMovies.map(
              ({ movie, actors: movieActors }, index) => (
                <motion.div
                  key={`${movie.id}-actor-rec-ordered`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  className="cursor-pointer group/item flex-none w-28"
                  onClick={() => handleMovieClick(movie.id)}
                >
                  <div
                    className={`relative aspect-[2/3] ${
                      roundedCorners ? "rounded-xl" : "rounded-lg"
                    } overflow-hidden border-2 border-white/20 group-hover/item:border-yellow-400 
                    transition-all duration-300 mb-2 shadow-lg group-hover/item:shadow-2xl
                    bg-gradient-to-b from-gray-800 to-gray-900`}
                    style={{
                      boxShadow:
                        "0 8px 25px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <NextImage
                      src={getImageUrl(movie.poster_path || "", "w300")}
                      alt={movie.title || "Постер"}
                      fill
                      sizes="112px"
                      className="object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />

                    {/* Градиентный оверлей */}
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent 
                                opacity-0 group-hover/item:opacity-100 transition-all duration-300 
                                flex flex-col justify-end p-2"
                    >
                      <div className="transform translate-y-2 group-hover/item:translate-y-0 transition-transform duration-300">
                        <p className="text-[11px] text-white font-bold line-clamp-2 leading-tight mb-1 drop-shadow-lg">
                          {movie.title}
                        </p>
                        <p className="text-[9px] text-yellow-400 font-semibold">
                          {getYear(movie.release_date)}
                        </p>
                      </div>
                    </div>

                    {/* Глянцевый эффект */}
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent 
                                opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 pointer-events-none"
                    ></div>

                    {/* Аватар актера */}
                    {movieActors.length > 0 && (
                      <div
                        className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100 
                                  transition-all duration-300 transform scale-75 group-hover/item:scale-100"
                      >
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-0.5 rounded-full shadow-lg">
                          {movieActors[0].profile_path ? (
                            <img
                              src={getImageUrl(
                                movieActors[0].profile_path,
                                "w45"
                              )}
                              alt={movieActors[0].name}
                              className="w-6 h-6 rounded-full object-cover border border-white/50"
                              loading="lazy"
                            />
                          ) : (
                            <div
                              className="w-6 h-6 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 
                                        flex items-center justify-center border border-white/50"
                            >
                              <User className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Эффект свечения при ховере */}
                    <div
                      className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 
                                rounded-xl blur opacity-0 group-hover/item:opacity-30 transition-opacity duration-300 -z-10"
                    ></div>
                  </div>

                  {/* Улучшенное имя актера */}
                  {movieActors.length > 0 && (
                    <div className="text-center px-1">
                      <p className="text-[10px] text-white/90 font-medium truncate leading-tight">
                        {movieActors[0].name}
                      </p>
                      <div
                        className="w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mt-1 
                                  opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"
                      ></div>
                    </div>
                  )}
                </motion.div>
              )
            )}
          </div>

          {/* Улучшенные кнопки навигации */}
          <button
            onClick={scrollLeft}
            className="absolute top-1/2 -translate-y-1/2 -left-1 z-20 p-2 rounded-full 
                     bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 
                     text-white shadow-lg hover:shadow-xl backdrop-blur-sm border border-white/20
                     transition-all duration-300 disabled:opacity-0 disabled:cursor-not-allowed 
                     opacity-0 md:group-hover:opacity-100 hover:scale-110 active:scale-95
                     before:absolute before:inset-0 before:bg-white/10 before:rounded-full before:blur-sm"
            style={{
              boxShadow: "0 8px 20px rgba(99, 102, 241, 0.4)",
            }}
          >
            <ChevronLeft className="w-5 h-5 relative z-10" />
          </button>

          <button
            onClick={scrollRight}
            className="absolute top-1/2 -translate-y-1/2 -right-1 z-20 p-2 rounded-full 
                     bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 
                     text-white shadow-lg hover:shadow-xl backdrop-blur-sm border border-white/20
                     transition-all duration-300 disabled:opacity-0 disabled:cursor-not-allowed 
                     opacity-0 md:group-hover:opacity-100 hover:scale-110 active:scale-95
                     before:absolute before:inset-0 before:bg-white/10 before:rounded-full before:blur-sm"
            style={{
              boxShadow: "0 8px 20px rgba(219, 39, 119, 0.4)",
            }}
          >
            <ChevronRight className="w-5 h-5 relative z-10" />
          </button>
        </div>

        {/* Декоративные элементы */}
        <div
          className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-r from-yellow-400/20 to-transparent 
                      rounded-full blur-xl opacity-50"
        ></div>
        <div
          className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-l from-pink-400/20 to-transparent 
                      rounded-full blur-xl opacity-50"
        ></div>
      </motion.div>
    );
  }
);
ActorNotification.displayName = "ActorNotification";
// === КОНЕЦ КОМПОНЕНТА УВЕДОМЛЕНИЯ ОБ АКТЕРАХ ===

export default ActorNotification; // Экспортируем компонент по умолчанию
