"use client";

import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/lib/tmdb"; // Убедимся, что getImageUrl импортирован
import { useCallback, useRef, Fragment, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Определяем типы для пропсов
interface MovieForGenreStrip {
  id: number;
  poster_path: string | null;
  title?: string;
  name?: string;
}

interface GenreWithMovies {
  id: number;
  name: string;
  movies: MovieForGenreStrip[];
}

interface GenreStripProps {
  title?: string;
  genresWithMovies: GenreWithMovies[]; // Новый проп
}

// Функция для получения градиента по ID жанра - с обновленными цветами
const getGenreGradient = (genreId: number): string => {
  switch (genreId) {
    case 28:
      return "bg-gradient-to-br from-red-600 via-rose-500 to-red-700"; // Боевик (более насыщенный)
    case 12:
      return "bg-gradient-to-br from-teal-500 via-cyan-500 to-emerald-600"; // Приключения (более бирюзово-зеленый)
    case 16:
      return "bg-gradient-to-br from-blue-400 via-sky-400 to-cyan-300"; // Мультфильм (светлее и ярче)
    case 35:
      return "bg-gradient-to-br from-yellow-300 via-lime-300 to-green-400"; // Комедия (ярче и веселее)
    case 80:
      return "bg-gradient-to-br from-slate-600 via-neutral-700 to-zinc-800"; // Криминал (темный, ок)
    case 99:
      return "bg-gradient-to-br from-blue-500 via-sky-600 to-cyan-700"; // Документальный (сине-голубой)
    case 18:
      return "bg-gradient-to-br from-indigo-600 via-blue-700 to-slate-800"; // Драма (глубже синий)
    case 10751:
      return "bg-gradient-to-br from-orange-300 via-yellow-300 to-amber-400"; // Семейный (теплее)
    case 14:
      return "bg-gradient-to-br from-fuchsia-500 via-purple-600 to-violet-700"; // Фэнтези (более фиолетовый)
    case 36:
      return "bg-gradient-to-br from-stone-600 via-amber-700 to-orange-800"; // История (более "земляной")
    case 27:
      return "bg-gradient-to-br from-rose-800 via-red-900 to-black"; // Ужасы (темно-красный, ок)
    case 10402:
      return "bg-gradient-to-br from-pink-500 via-purple-600 to-fuchsia-600"; // Музыка (яркий, ок)
    case 9648:
      return "bg-gradient-to-br from-purple-700 via-indigo-800 to-slate-900"; // Детектив (глубже фиолетовый/синий)
    case 10749:
      return "bg-gradient-to-br from-pink-400 via-rose-400 to-red-400"; // Мелодрама (нежнее)
    case 878:
      return "bg-gradient-to-br from-sky-500 via-cyan-600 to-indigo-700"; // Фантастика (более "электрик")
    case 53:
      return "bg-gradient-to-br from-slate-500 via-gray-600 to-neutral-700"; // Триллер (приглушенный, ок)
    case 10752:
      return "bg-gradient-to-br from-green-700 via-emerald-800 to-teal-900"; // Военный (темнее зеленый)
    case 37:
      return "bg-gradient-to-br from-amber-600 via-yellow-700 to-orange-800"; // Вестерн (более "песочный")
    default:
      return "bg-gradient-to-br from-gray-700 to-gray-800";
  }
};

export default function GenreStrip({
  title = "ЖАНРЫ",
  genresWithMovies,
}: GenreStripProps) {
  const generateTimestamp = useCallback(() => Date.now(), []);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [roundedCorners, setRoundedCorners] = useState(false);

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
    const scrollAmount = direction === "left" ? -300 : 300;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  if (genresWithMovies.length === 0) {
    return null;
  }

  return (
    <section className="relative">
      <div className="px-2 md:px-6">
        <h2 className="text-xl uppercase tracking-wide font-exo-2 pb-2 pr-2 relative border-b border-transparent mb-3">
          {title}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent"></div>
        </h2>
      </div>
      <div className="group relative">
        <div
          ref={scrollRef}
          className="flex items-center justify-start overflow-x-auto gap-4 py-4 scrollbar-hide scroll-smooth px-1 md:px-6"
        >
          {genresWithMovies.map((genre) => {
            const gradientClass = getGenreGradient(genre.id);
            return (
              <Link
                key={genre.id}
                href={`/discover?with_genres=${
                  genre.id
                }&sort_by=popularity.desc&t=${generateTimestamp()}`}
                className="flex-shrink-0 group/genreblock"
              >
                <div
                  className={`relative w-60 h-52 md:w-72 md:h-60 ${gradientClass} ${
                    roundedCorners ? "rounded-xl" : "rounded-md"
                  } overflow-hidden shadow-lg transition-all duration-300 ease-in-out transform`}
                >
                  <div className="absolute inset-0 bg-black/20 z-10 group-hover/genreblock:bg-black/10 transition-colors duration-300"></div>

                  <div className="relative z-20 flex items-center justify-center h-[calc(100%-8rem)] md:h-[calc(100%-9rem)] p-2">
                    {" "}
                    {/* 8rem для ОЧЕНЬ больших постеров (128px) */}{" "}
                    {/* 4rem для постеров + 0.5rem отступ */}
                    <h3 className="text-white text-lg md:text-xl font-exo-2 font-semibold uppercase tracking-wider text-center break-words drop-shadow-md">
                      {genre.name}
                    </h3>
                  </div>

                  {genre.movies && genre.movies.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-36 md:h-40 z-20 flex justify-center items-end gap-1 px-2 pb-1 pt-1">
                      {genre.movies.slice(0, 3).map((movie, index) => {
                        // Определяем стили для каждого постера
                        let posterStyles =
                          "relative w-[72px] h-[108px] md:w-[80px] md:h-[120px] shadow-lg group-hover/genreblock:opacity-95 transition-all duration-300 ease-in-out border-2 border-black/30 overflow-hidden";
                        posterStyles += roundedCorners
                          ? " rounded-xl"
                          : " rounded-md";

                        // Обновленные стили для наложения, поворота и высоты
                        if (genre.movies.slice(0, 3).length === 1) {
                          posterStyles +=
                            " z-20 -translate-y-2 group-hover/genreblock:scale-110 group-hover/genreblock:-translate-y-4"; // Один фильм, чуть поднят + ховер эффект
                        } else if (genre.movies.slice(0, 3).length === 2) {
                          if (index === 0) {
                            posterStyles +=
                              " z-10 -rotate-[10deg] translate-x-[12px] group-hover/genreblock:scale-105 group-hover/genreblock:-translate-y-2"; // Левый + ховер
                          } else {
                            posterStyles +=
                              " z-20 rotate-[0deg] -translate-x-[12px] -translate-y-3 group-hover/genreblock:scale-110 group-hover/genreblock:-translate-y-5"; // Правый (центральный), выше + ховер
                          }
                        } else {
                          // Три фильма
                          if (index === 0) {
                            posterStyles +=
                              " z-10 -rotate-[15deg] translate-x-[25px] group-hover/genreblock:scale-105 group-hover/genreblock:-translate-y-2"; // Левый + ховер
                          } else if (index === 1) {
                            posterStyles +=
                              " z-20 rotate-[0deg] -translate-y-4 group-hover/genreblock:scale-110 group-hover/genreblock:-translate-y-6"; // Центральный, постоянно выше + ховер
                          } else if (index === 2) {
                            posterStyles +=
                              " z-10 rotate-[15deg] -translate-x-[25px] group-hover/genreblock:scale-105 group-hover/genreblock:-translate-y-2"; // Правый + ховер
                          }
                        }

                        return (
                          movie.poster_path && (
                            <div
                              key={movie.id}
                              className={posterStyles}
                              style={
                                {
                                  // marginBottom: "-10px", // Пример для "выхода" из низа, если overflow родителя позволяет
                                }
                              }
                            >
                              <Image
                                src={getImageUrl(movie.poster_path, "w300")}
                                alt={movie.title || movie.name || "Постер"}
                                fill
                                className={`object-cover ${
                                  roundedCorners ? "rounded-xl" : "rounded-md"
                                }`}
                                sizes="(max-width: 768px) 20vw, 10vw"
                              />
                            </div>
                          )
                        );
                      })}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
        <button
          onClick={() => scroll("left")}
          className="absolute top-1/2 -translate-y-1/2 left-2 z-30 p-2 rounded-full 
                     bg-yellow-400 hover:bg-yellow-500 text-black 
                     transition-all duration-300 disabled:opacity-0 disabled:cursor-not-allowed 
                     opacity-0 md:group-hover:opacity-100"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute top-1/2 -translate-y-1/2 right-2 z-30 p-2 rounded-full 
                     bg-yellow-400 hover:bg-yellow-500 text-black 
                     transition-all duration-300 disabled:opacity-0 disabled:cursor-not-allowed 
                     opacity-0 md:group-hover:opacity-100"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}
