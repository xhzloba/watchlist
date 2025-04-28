"use client";

import { useState, useEffect, useRef } from "react";
import { X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import NextImage from "next/image";
import { getImageUrl } from "@/lib/tmdb";
import { useDebounce } from "@/hooks/use-debounce";
import { playSound } from "@/lib/sound-utils";

// Компонент для анимации AI-частиц
const AIParticlesEffect = ({ isActive }: { isActive: boolean }) => {
  return (
    <div
      className={`w-6 h-6 relative ${
        isActive ? "opacity-100 scale-110" : "opacity-60"
      } transition-all duration-300`}
    >
      {/* Фоновое свечение */}
      <div
        className={`absolute inset-0 rounded-full ${
          isActive ? "bg-yellow-500/10 animate-pulse" : "bg-transparent"
        }`}
      ></div>

      {/* Центральная точка */}
      <div
        className={`absolute w-1 h-1 rounded-full bg-yellow-500 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 
        ${
          isActive ? "animate-pulse shadow-[0_0_2px_rgba(234,179,8,0.4)]" : ""
        }`}
      />

      {/* Вращающиеся частицы */}
      <div className="absolute inset-0 w-full h-full">
        {/* Основные частицы */}
        <div
          className={`absolute w-0.5 h-0.5 rounded-full ${
            isActive
              ? "bg-yellow-400 shadow-[0_0_1px_rgba(234,179,8,0.3)]"
              : "bg-yellow-500/70"
          } left-0 top-1/2 transform -translate-y-1/2 animate-particle-1`}
        />
        <div
          className={`absolute w-0.5 h-0.5 rounded-full ${
            isActive
              ? "bg-yellow-400 shadow-[0_0_1px_rgba(234,179,8,0.3)]"
              : "bg-yellow-500/70"
          } right-0 top-1/2 transform -translate-y-1/2 animate-particle-2`}
        />
        <div
          className={`absolute w-0.5 h-0.5 rounded-full ${
            isActive
              ? "bg-yellow-400 shadow-[0_0_1px_rgba(234,179,8,0.3)]"
              : "bg-yellow-500/70"
          } top-0 left-1/2 transform -translate-x-1/2 animate-particle-3`}
        />
        <div
          className={`absolute w-0.5 h-0.5 rounded-full ${
            isActive
              ? "bg-yellow-400 shadow-[0_0_1px_rgba(234,179,8,0.3)]"
              : "bg-yellow-500/70"
          } bottom-0 left-1/2 transform -translate-x-1/2 animate-particle-4`}
        />

        {/* Диагональные частицы */}
        <div
          className={`absolute w-0.5 h-0.5 rounded-full ${
            isActive
              ? "bg-yellow-300 shadow-[0_0_1px_rgba(234,179,8,0.3)]"
              : "bg-yellow-500/60"
          } left-1 top-1 animate-particle-5`}
        />
        <div
          className={`absolute w-0.5 h-0.5 rounded-full ${
            isActive
              ? "bg-yellow-300 shadow-[0_0_1px_rgba(234,179,8,0.3)]"
              : "bg-yellow-500/60"
          } right-1 top-1 animate-particle-6`}
        />
        <div
          className={`absolute w-0.5 h-0.5 rounded-full ${
            isActive
              ? "bg-yellow-300 shadow-[0_0_1px_rgba(234,179,8,0.3)]"
              : "bg-yellow-500/60"
          } left-1 bottom-1 animate-micro-particle-3`}
        />
        <div
          className={`absolute w-0.5 h-0.5 rounded-full ${
            isActive
              ? "bg-yellow-300 shadow-[0_0_1px_rgba(234,179,8,0.3)]"
              : "bg-yellow-500/60"
          } right-1 bottom-1 animate-micro-particle-4`}
        />

        {/* Дополнительные микрочастицы */}
        <div
          className={`absolute w-0.5 h-0.5 rounded-full ${
            isActive
              ? "bg-yellow-200 shadow-[0_0_1px_rgba(234,179,8,0.2)]"
              : "bg-yellow-500/40"
          } left-[25%] top-[25%] animate-micro-particle-1`}
        />
        <div
          className={`absolute w-0.5 h-0.5 rounded-full ${
            isActive
              ? "bg-yellow-200 shadow-[0_0_1px_rgba(234,179,8,0.2)]"
              : "bg-yellow-500/40"
          } right-[25%] top-[25%] animate-micro-particle-2`}
        />
        <div
          className={`absolute w-0.5 h-0.5 rounded-full ${
            isActive
              ? "bg-yellow-200 shadow-[0_0_1px_rgba(234,179,8,0.2)]"
              : "bg-yellow-500/40"
          } left-[25%] bottom-[25%] animate-micro-particle-5`}
        />
        <div
          className={`absolute w-0.5 h-0.5 rounded-full ${
            isActive
              ? "bg-yellow-200 shadow-[0_0_1px_rgba(234,179,8,0.2)]"
              : "bg-yellow-500/40"
          } right-[25%] bottom-[25%] animate-micro-particle-4`}
        />
      </div>

      {/* Лучи света */}
      {isActive && (
        <>
          <div className="absolute left-1/2 top-1/2 h-[1px] w-3 bg-yellow-500/20 -translate-x-1/2 -translate-y-1/2 animate-light-ray-1"></div>
          <div className="absolute left-1/2 top-1/2 h-3 w-[1px] bg-yellow-500/20 -translate-x-1/2 -translate-y-1/2 animate-light-ray-2"></div>
        </>
      )}
    </div>
  );
};

interface SearchResult {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
  vote_average?: number;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);

  // Обработчик клика вне компонента поиска
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Поиск фильмов при изменении запроса
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const searchMovies = async () => {
      setIsLoading(true);
      try {
        console.log(`Поисковый запрос: ${debouncedQuery}`);
        const response = await fetch(
          `/api/search?query=${encodeURIComponent(debouncedQuery)}`
        );

        if (!response.ok) {
          throw new Error(`Ошибка поиска: ${response.status}`);
        }

        const data = await response.json();
        console.log("Полученные результаты:", data);

        if (data.results && Array.isArray(data.results)) {
          // Фильтруем результаты локально для более точного поиска
          const filteredResults = data.results.filter((movie: SearchResult) => {
            const searchQuery = debouncedQuery.toLowerCase();
            const titleMatch = movie.title?.toLowerCase().includes(searchQuery);
            const originalTitleMatch = (movie as any).original_title
              ?.toLowerCase()
              .includes(searchQuery);
            return titleMatch || originalTitleMatch;
          });

          setResults(filteredResults.slice(0, 10));
          setShowResults(true);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error("Ошибка поиска:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchMovies();
  }, [debouncedQuery]);

  // Переход к детальной странице фильма с индикатором загрузки
  const handleMovieClick = (id: number) => {
    // Воспроизводим звук при клике
    playSound("choose.mp3");

    // Показываем индикатор загрузки
    document.body.classList.add("loading");

    // Переходим на страницу фильма
    router.push(`/movie/${id}`);

    setShowResults(false);
    setQuery("");
  };

  // Очистка поискового запроса
  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative" ref={searchRef}>
      {/* Поле поиска с улучшенным дизайном */}
      <div className="relative group">
        <div
          className={`relative focus-within:text-white text-gray-400 
          transition-all duration-300 rounded-full ${
            isFocused
              ? "ring-1 ring-yellow-500/40 animate-search-glow"
              : "hover:ring-1 hover:ring-gray-700"
          }`}
        >
          {/* Заменяем иконку поиска на AI эффект */}
          <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 transition-all duration-300">
            <AIParticlesEffect isActive={isFocused} />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск фильмов..."
            className={`w-64 md:w-80 transition-all duration-300 bg-black/40 hover:bg-black/50 text-white text-sm
              pl-14 pr-10 py-2.5 rounded-full focus:outline-none focus:bg-black/70
              border border-gray-800 focus:border-yellow-500/70
              ${
                isFocused
                  ? "placeholder:text-yellow-500/50 placeholder:font-light text-yellow-50"
                  : "placeholder:text-gray-400"
              }`}
            onFocus={() => {
              setIsFocused(true);
              if (results.length > 0) setShowResults(true);
            }}
            onBlur={() => {
              setIsFocused(false);
            }}
          />

          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 
                hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700/20"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Улучшенный выпадающий список результатов */}
      {showResults && results.length > 0 && (
        <div
          className="absolute left-0 mt-3 w-full min-w-[340px] bg-[#151515] rounded-xl 
          shadow-2xl overflow-hidden z-50 border border-gray-800
          transition-all duration-300 transform origin-top"
        >
          <div className="max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
            {results.map((movie) => (
              <div
                key={movie.id}
                className="p-3 hover:bg-gray-800/50 cursor-pointer transition-colors 
                  border-b border-gray-800/50 last:border-b-0 flex items-center gap-3"
                onClick={() => handleMovieClick(movie.id)}
              >
                {/* Постер фильма с улучшенным дизайном */}
                <div className="flex-shrink-0 w-11 h-16 bg-gray-800 rounded-md overflow-hidden shadow-md">
                  {movie.poster_path ? (
                    <NextImage
                      src={getImageUrl(movie.poster_path, "w92")}
                      alt={movie.title}
                      width={44}
                      height={64}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs bg-gray-800">
                      Нет
                      <br />
                      постера
                    </div>
                  )}
                </div>

                {/* Информация о фильме с улучшенным форматированием */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white truncate">
                    {movie.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5">
                    {movie.release_date && (
                      <span className="text-xs text-gray-400">
                        {movie.release_date.split("-")[0]}
                      </span>
                    )}
                    {movie.vote_average && movie.vote_average > 0 && (
                      <div
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          movie.vote_average >= 7
                            ? "bg-green-900/40 text-green-400"
                            : movie.vote_average >= 5
                            ? "bg-yellow-900/40 text-yellow-400"
                            : "bg-red-900/40 text-red-400"
                        }`}
                      >
                        {movie.vote_average.toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Улучшенный индикатор загрузки */}
      {isLoading && debouncedQuery.length >= 2 && (
        <div
          className="absolute left-0 mt-3 w-full min-w-[340px] bg-[#151515] rounded-xl 
          shadow-2xl p-4 z-50 border border-gray-800"
        >
          <div className="flex justify-center items-center gap-2">
            <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
            <span className="text-sm text-gray-300">Поиск фильмов...</span>
          </div>
        </div>
      )}
    </div>
  );
}
