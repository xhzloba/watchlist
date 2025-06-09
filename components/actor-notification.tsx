"use client";

import { useEffect, useState, useMemo, memo } from "react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import type { Movie, Cast } from "@/lib/tmdb";
import { getImageUrl, getYear, getPersonMovieCredits } from "@/lib/tmdb";
import { playSound } from "@/lib/sound-utils";
import { X, User } from "lucide-react";

// Утилита для перемешивания массива (Fisher-Yates shuffle)
function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length,
    randomIndex;
  const newArray = [...array];
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [newArray[currentIndex], newArray[randomIndex]] = [
      newArray[randomIndex],
      newArray[currentIndex],
    ];
  }
  return newArray;
}

interface ActorNotificationProps {
  actors: Cast[];
  onClose: () => void;
  currentMovieId: number;
  topActorIds: number[];
}

const ActorNotification: React.FC<ActorNotificationProps> = memo(
  ({ actors, onClose, currentMovieId, topActorIds }) => {
    const router = useRouter();
    const [topMoviesPerActor, setTopMoviesPerActor] = useState<
      Record<number, Movie[]>
    >({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Запускаем анимацию появления после монтирования
    useEffect(() => {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
      const fetchActorMovies = async () => {
        if (!actors || actors.length === 0) {
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);
        const moviesData: Record<number, Movie[]> = {};

        try {
          const creditPromises = actors.map((actor) =>
            getPersonMovieCredits(actor.id)
              .then((credits) => {
                const sortedMovies = credits.cast.sort(
                  (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)
                );
                const filteredMovies = sortedMovies.filter(
                  (m) => m.id !== currentMovieId
                );
                const topNMovies = filteredMovies.slice(0, 10);
                return {
                  actorId: actor.id,
                  movies: topNMovies,
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

    const orderedAndShuffledMovies = useMemo(() => {
      if (isLoading || error || actors.length === 0) return [];

      const finalMovieList: { movie: Movie; actors: Cast[] }[] = [];
      const addedMovieIds = new Set<number>();

      const addMovieIfNeeded = (movie: Movie, actor: Cast) => {
        if (!addedMovieIds.has(movie.id)) {
          finalMovieList.push({ movie, actors: [actor] });
          addedMovieIds.add(movie.id);
          return true;
        }
        return false;
      };

      // Топ-3 актера
      for (let i = 0; i < 3 && i < actors.length; i++) {
        const actor = actors[i];
        const actorMovies = topMoviesPerActor[actor.id] || [];
        let addedCountForThisActor = 0;
        for (const movie of actorMovies) {
          if (addMovieIfNeeded(movie, actor)) {
            addedCountForThisActor++;
            if (addedCountForThisActor >= 2) break;
          }
        }
      }

      // Остальные актеры
      const remainingPotentialMovies: { movie: Movie; actor: Cast }[] = [];
      for (let i = 3; i < actors.length; i++) {
        const actor = actors[i];
        const actorMovies = topMoviesPerActor[actor.id] || [];
        actorMovies.forEach((movie) => {
          if (!addedMovieIds.has(movie.id)) {
            remainingPotentialMovies.push({ movie, actor });
          }
        });
      }

      const remainingMovieMap = new Map<
        number,
        { movie: Movie; actors: Cast[] }
      >();
      remainingPotentialMovies.forEach(({ movie, actor }) => {
        if (remainingMovieMap.has(movie.id)) {
          const existingEntry = remainingMovieMap.get(movie.id)!;
          if (!existingEntry.actors.some((a) => a.id === actor.id)) {
            existingEntry.actors.push(actor);
          }
        } else {
          if (!addedMovieIds.has(movie.id)) {
            remainingMovieMap.set(movie.id, { movie: movie, actors: [actor] });
          }
        }
      });

      const shuffledOther = shuffleArray(
        Array.from(remainingMovieMap.values())
      );
      const combinedList = [...finalMovieList, ...shuffledOther];
      return combinedList.slice(0, 12);
    }, [actors, topMoviesPerActor, isLoading, error]);

    if (isLoading || error || orderedAndShuffledMovies.length === 0) {
      return null;
    }

    const handleMovieClick = (movieId: number) => {
      setIsClosing(true);
      playSound("choose.mp3");

      setTimeout(() => {
        onClose();
        router.push(`/movie/${movieId}`);
      }, 150);
    };

    const handleClose = () => {
      setIsClosing(true);
      setTimeout(() => {
        onClose();
      }, 150);
    };

    return (
      <div
        className={`fixed bottom-4 left-4 right-4 md:bottom-4 md:right-4 md:left-auto md:w-[500px] z-[70] 
                    bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 text-white
                    ${
                      isVisible && !isClosing
                        ? "opacity-100 translate-y-0 scale-100 transition-all duration-500 ease-out"
                        : isClosing
                        ? "opacity-0 translate-y-4 scale-95 transition-all duration-150 ease-in"
                        : "opacity-0 translate-y-8 scale-90 transition-all duration-500 ease-out"
                    }`}
        style={{
          transform:
            isVisible && !isClosing
              ? "translateY(0) scale(1)"
              : isClosing
              ? "translateY(16px) scale(0.95)"
              : "translateY(32px) scale(0.9)",
        }}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-black" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Хиты с актерами фильма</h3>
              <p className="text-xs text-gray-400">
                {orderedAndShuffledMovies.length} рекомендаций
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors duration-150"
          >
            <X size={16} />
          </button>
        </div>

        {/* Список фильмов */}
        <div className="p-3">
          <div className="grid grid-cols-6 gap-2">
            {orderedAndShuffledMovies.map(
              ({ movie, actors: movieActors }, index) => (
                <div
                  key={movie.id}
                  className={`cursor-pointer group
                           ${
                             isVisible
                               ? "opacity-100 translate-y-0 transition-all duration-300 ease-out"
                               : "opacity-0 translate-y-4 transition-all duration-300 ease-out"
                           }`}
                  style={{
                    transitionDelay: isVisible ? `${index * 30}ms` : "0ms",
                  }}
                  onClick={() => handleMovieClick(movie.id)}
                >
                  <div
                    className="relative aspect-[2/3] rounded-md overflow-hidden bg-gray-800 
                               border border-gray-700 group-hover:border-yellow-500 transition-colors duration-150"
                  >
                    {movie.poster_path ? (
                      <NextImage
                        src={getImageUrl(movie.poster_path, "w185")}
                        alt={movie.title || ""}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <User className="w-6 h-6" />
                      </div>
                    )}

                    {/* Название при ховере */}
                    <div
                      className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 
                                 transition-opacity duration-150 flex items-end p-1"
                    >
                      <div className="text-[10px] text-white">
                        <p className="font-medium line-clamp-2 leading-tight">
                          {movie.title}
                        </p>
                        <p className="text-gray-300">
                          {getYear(movie.release_date)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Имя актера */}
                  {movieActors.length > 0 && (
                    <p className="text-[9px] text-gray-400 mt-1 truncate text-center">
                      {movieActors[0].name}
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  }
);

ActorNotification.displayName = "ActorNotification";

export default ActorNotification;
