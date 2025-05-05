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
}

const ActorNotification: React.FC<ActorNotificationProps> = memo(
  ({ actors, onClose, currentMovieId }) => {
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

    // useMemo для создания УНИКАЛЬНОГО и ПЕРЕМЕШАННОГО списка фильмов
    const shuffledUniqueMovies = useMemo(() => {
      if (isLoading || error) return [];

      const movieMap = new Map<number, { movie: Movie; actors: Cast[] }>();

      // Собираем уникальные фильмы и всех связанных актеров из топ-8
      actors.forEach((actor) => {
        // Используем данные из нового состояния topMoviesPerActor
        const movies = topMoviesPerActor[actor.id] || [];
        movies.forEach((movie) => {
          if (movieMap.has(movie.id)) {
            const existingEntry = movieMap.get(movie.id)!;
            if (!existingEntry.actors.some((a) => a.id === actor.id)) {
              existingEntry.actors.push(actor);
            }
          } else {
            movieMap.set(movie.id, { movie: movie, actors: [actor] });
          }
        });
      });

      // Преобразуем карту в массив
      const uniqueEntries = Array.from(movieMap.values());

      // Перемешиваем массив уникальных фильмов
      const shuffledEntries = shuffleArray(uniqueEntries);

      // Берем первые 16 (или меньше)
      return shuffledEntries.slice(0, 16);

      // Обновляем зависимости, добавляем topMoviesPerActor
    }, [actors, topMoviesPerActor, isLoading, error]);

    if (isLoading) {
      return null;
    }

    // Используем shuffledUniqueMovies для проверки
    if (error || shuffledUniqueMovies.length === 0) {
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
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed bottom-4 right-4 z-[70] w-80 md:w-96 max-w-[calc(100vw-2rem)] bg-blue-600 rounded-xl shadow-lg border border-black/20 overflow-hidden text-white"
      >
        <div className="p-2 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-white" />
            <h3 className="text-sm font-semibold truncate">
              Хиты с актерами фильма
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
            aria-label="Закрыть уведомление"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-2 relative group">
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto scrollbar-hide gap-2 pb-1 scroll-smooth"
          >
            {shuffledUniqueMovies.map(({ movie, actors: movieActors }) => (
              <div
                key={`${movie.id}-actor-rec-shuffled`}
                className="cursor-pointer group/item flex-none w-24"
                onClick={() => handleMovieClick(movie.id)}
              >
                <div
                  className={`relative aspect-[2/3] ${
                    roundedCorners ? "rounded-md" : "rounded"
                  } overflow-hidden border-2 border-transparent group-hover/item:border-white transition-colors duration-200 mb-1`}
                >
                  <NextImage
                    src={getImageUrl(movie.poster_path || "", "w300")}
                    alt={movie.title || "Постер"}
                    fill
                    sizes="96px"
                    className="object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                  {/* Оверлей */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-1">
                    <p className="text-[10px] text-white font-semibold line-clamp-2 leading-tight">
                      {movie.title} ({getYear(movie.release_date)})
                    </p>
                  </div>
                  {/* Отображение первого актера */}
                  {movieActors.length > 0 && (
                    <div className="absolute top-1 left-1 bg-black/60 rounded-full px-1.5 py-0.5 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200">
                      {movieActors[0].profile_path ? (
                        <img
                          src={getImageUrl(movieActors[0].profile_path, "w45")}
                          alt={movieActors[0].name}
                          className="w-3 h-3 rounded-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <User className="w-3 h-3 text-gray-300" />
                      )}
                    </div>
                  )}
                </div>
                {/* Имя актера под постером */}
                {movieActors.length > 0 && (
                  <p className="text-[10px] text-center text-gray-300 truncate px-1">
                    {movieActors[0].name}
                  </p>
                )}
              </div>
            ))}
          </div>
          {/* Кнопки навигации */}
          <button
            onClick={scrollLeft}
            className="absolute top-1/2 -translate-y-1/2 left-0 z-10 p-1 rounded-full 
                     bg-black/40 hover:bg-black/70 text-white 
                     transition-all duration-300 disabled:opacity-0 disabled:cursor-not-allowed 
                     opacity-0 md:group-hover:opacity-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollRight}
            className="absolute top-1/2 -translate-y-1/2 right-0 z-10 p-1 rounded-full 
                     bg-black/40 hover:bg-black/70 text-white 
                     transition-all duration-300 disabled:opacity-0 disabled:cursor-not-allowed 
                     opacity-0 md:group-hover:opacity-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    );
  }
);
ActorNotification.displayName = "ActorNotification";
// === КОНЕЦ КОМПОНЕНТА УВЕДОМЛЕНИЯ ОБ АКТЕРАХ ===

export default ActorNotification; // Экспортируем компонент по умолчанию
