"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { fetchKeywordMovies } from "@/lib/keywords";
import MovieGrid from "@/components/movie-grid";
import type { Movie } from "@/lib/tmdb";
import type { PosterSize } from "@/components/movie-grid";

interface InfiniteMovieGridProps {
  initialMovies: Movie[];
  keywordIds: number[];
  initialPage: number;
  totalPages: number;
  useDiscoverStyle?: boolean;
  posterSize?: PosterSize;
}

export default function InfiniteMovieGrid({
  initialMovies,
  keywordIds,
  initialPage,
  totalPages,
  useDiscoverStyle = false,
  posterSize = "small",
}: InfiniteMovieGridProps) {
  // Начинаем с исходных фильмов, полученных с сервера
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [page, setPage] = useState<number>(initialPage);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(page < totalPages);

  // Функция для загрузки следующей страницы фильмов
  const loadMoreMovies = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const nextPage = page + 1;
      const newMoviesData = await fetchKeywordMovies(keywordIds, nextPage, 200);

      if (newMoviesData.results.length > 0) {
        setMovies((prevMovies) => [...prevMovies, ...newMoviesData.results]);
        setPage(nextPage);
        setHasMore(nextPage < newMoviesData.total_pages);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Ошибка при загрузке дополнительных фильмов:", error);
    } finally {
      setLoading(false);
    }
  }, [keywordIds, page, loading, hasMore]);

  // Обработчик для Intersection Observer
  const observer = useRef<IntersectionObserver | null>(null);
  const lastMovieElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (loading) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreMovies();
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, loadMoreMovies]
  );

  return (
    <>
      <MovieGrid
        movies={movies}
        lastMovieRef={lastMovieElementRef}
        emptyMessage="В этой коллекции пока нет фильмов"
        useDiscoverStyle={useDiscoverStyle}
        posterSize={posterSize}
      />

      {loading && (
        <div className="py-8 flex justify-center items-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 w-full h-full border-4 border-yellow-500/20 rounded-full"></div>
            <div className="absolute inset-0 w-full h-full border-4 border-transparent border-t-yellow-500 rounded-full animate-spin"></div>
          </div>
          <span className="ml-4 text-gray-300">Загрузка фильмов...</span>
        </div>
      )}
    </>
  );
}
