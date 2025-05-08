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
    <div className="relative px-1 md:px-6">
      <h2 className="text-xl uppercase tracking-wide font-exo-2 pb-2 pr-2 relative border-b border-transparent mb-3">
        {title}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent"></div>
      </h2>
      <div className="group relative">
        <div
          ref={scrollRef}
          className="flex items-center justify-start overflow-x-auto gap-4 py-4 scrollbar-hide scroll-smooth"
        >
          {genresWithMovies.map((genre) => (
            <Link
              key={genre.id}
              href={`/discover?with_genres=${
                genre.id
              }&sort_by=popularity.desc&t=${generateTimestamp()}`}
              className="flex-shrink-0 group/genreblock"
            >
              <div className="relative w-60 h-52 md:w-72 md:h-60 bg-gray-800/70 rounded-lg overflow-hidden shadow-lg transition-all duration-300 ease-in-out transform border-2 border-transparent group-hover/genreblock:border-white">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent z-10 group-hover/genreblock:from-black/90 group-hover/genreblock:via-black/60 transition-all duration-300"></div>
                <div className="relative z-20 flex items-center justify-center h-[calc(100%-8rem)] md:h-[calc(100%-9rem)] p-2">
                  {" "}
                  {/* 8rem для ОЧЕНЬ больших постеров (128px) */}{" "}
                  {/* 4rem для постеров + 0.5rem отступ */}
                  <h3 className="text-white text-lg md:text-xl font-exo-2 font-semibold uppercase tracking-wider text-center break-words">
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
                            className={`relative w-[72px] h-[108px] md:w-[80px] md:h-[120px] rounded-md shadow-md group-hover/genreblock:opacity-95 transition-transform duration-300 border-2 border-black/30 overflow-hidden ${
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
          ))}
        </div>
        <button
          onClick={() => scroll("left")}
          className="absolute top-1/2 -translate-y-1/2 left-0 z-30 p-2 rounded-full 
                     bg-yellow-400 hover:bg-yellow-500 text-black 
                     transition-all duration-300 disabled:opacity-0 disabled:cursor-not-allowed 
                     opacity-0 md:group-hover:opacity-100"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute top-1/2 -translate-y-1/2 right-0 z-30 p-2 rounded-full 
                     bg-yellow-400 hover:bg-yellow-500 text-black 
                     transition-all duration-300 disabled:opacity-0 disabled:cursor-not-allowed 
                     opacity-0 md:group-hover:opacity-100"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
