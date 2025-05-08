"use client";

import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/lib/tmdb"; // Убедимся, что getImageUrl импортирован
import { useCallback, useRef, Fragment } from "react";
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

// Функция для получения градиента по ID жанра
const getGenreGradient = (genreId: number): string => {
  switch (genreId) {
    case 28:
      return "bg-gradient-to-br from-red-500 via-orange-500 to-red-600"; // Боевик
    case 12:
      return "bg-gradient-to-br from-emerald-500 via-teal-600 to-green-600"; // Приключения
    case 16:
      return "bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500"; // Мультфильм
    case 35:
      return "bg-gradient-to-br from-lime-400 via-yellow-400 to-green-500"; // Комедия
    case 80:
      return "bg-gradient-to-br from-slate-600 via-neutral-700 to-zinc-800"; // Криминал
    case 99:
      return "bg-gradient-to-br from-cyan-600 via-sky-700 to-blue-700"; // Документальный
    case 18:
      return "bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-800"; // Драма
    case 10751:
      return "bg-gradient-to-br from-yellow-300 via-orange-400 to-amber-500"; // Семейный
    case 14:
      return "bg-gradient-to-br from-purple-500 via-fuchsia-600 to-indigo-600"; // Фэнтези
    case 36:
      return "bg-gradient-to-br from-amber-700 via-orange-800 to-stone-800"; // История
    case 27:
      return "bg-gradient-to-br from-rose-800 via-red-900 to-black"; // Ужасы
    case 10402:
      return "bg-gradient-to-br from-pink-500 via-purple-600 to-fuchsia-600"; // Музыка
    case 9648:
      return "bg-gradient-to-br from-indigo-700 via-violet-800 to-neutral-900"; // Детектив
    case 10749:
      return "bg-gradient-to-br from-rose-400 via-pink-500 to-red-500"; // Мелодрама
    case 878:
      return "bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-700"; // Фантастика
    case 53:
      return "bg-gradient-to-br from-slate-500 via-gray-600 to-neutral-700"; // Триллер
    case 10752:
      return "bg-gradient-to-br from-lime-700 via-green-800 to-emerald-900"; // Военный
    case 37:
      return "bg-gradient-to-br from-yellow-600 via-amber-700 to-orange-800"; // Вестерн
    default:
      return "bg-gradient-to-br from-gray-700 to-gray-800"; // По умолчанию
  }
};

export default function GenreStrip({
  title = "ЖАНРЫ",
  genresWithMovies,
}: GenreStripProps) {
  const generateTimestamp = useCallback(() => Date.now(), []);
  const scrollRef = useRef<HTMLDivElement>(null);

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
            const gradientClass = getGenreGradient(genre.id); // Получаем классы градиента
            return (
              <Link
                key={genre.id}
                href={`/discover?with_genres=${
                  genre.id
                }&sort_by=popularity.desc&t=${generateTimestamp()}`}
                className="flex-shrink-0 group/genreblock"
              >
                <div
                  className={`relative w-60 h-52 md:w-72 md:h-60 ${gradientClass} rounded-lg overflow-hidden shadow-lg transition-all duration-300 ease-in-out transform border-2 border-transparent group-hover/genreblock:border-white`}
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
                    <div className="absolute bottom-0 left-0 right-0 h-32 md:h-36 z-20 flex justify-center items-center gap-2 px-2 pb-2 pt-1">
                      {genre.movies.slice(0, 3).map(
                        (movie, index) =>
                          movie.poster_path && (
                            <div
                              key={movie.id}
                              className={`relative w-[72px] h-[108px] md:w-[80px] md:h-[120px] rounded-md shadow-lg group-hover/genreblock:opacity-95 transition-transform duration-300 border-2 border-black/30 overflow-hidden ${
                                index === 0 ? "-rotate-3 translate-y-1" : ""
                              } ${index === 2 ? "rotate-3 translate-y-1" : ""}`}
                            >
                              <Image
                                src={getImageUrl(movie.poster_path, "w300")}
                                alt={movie.title || movie.name || "Постер"}
                                fill
                                className="object-cover rounded-md"
                                sizes="(max-width: 768px) 20vw, 10vw"
                              />
                            </div>
                          )
                      )}
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
