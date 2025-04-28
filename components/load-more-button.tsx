"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { fetchKeywordMovies } from "@/lib/keywords";
import MovieGrid from "@/components/movie-grid";

export default function LoadMoreButton({
  keywordIds,
  initialPage,
  totalPages,
}: {
  keywordIds: number[];
  initialPage: number;
  totalPages: number;
}) {
  const [movies, setMovies] = useState<any[]>([]);
  const [page, setPage] = useState(initialPage + 1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPage < totalPages);

  // Ref для последнего элемента в списке
  const observer = useRef<IntersectionObserver | null>(null);
  const lastMovieElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (loading) return;

      // Отключаем предыдущий observer
      if (observer.current) observer.current.disconnect();

      // Создаем новый observer
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      });

      // Наблюдаем за новым элементом
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetchKeywordMovies(keywordIds, page);
      setMovies((prevMovies) => [...prevMovies, ...response.results]);
      setPage((prevPage) => prevPage + 1);
      setHasMore(page < response.total_pages);
    } catch (error) {
      console.error("Ошибка при загрузке дополнительных фильмов:", error);
    } finally {
      setLoading(false);
    }
  };

  // Автоматически загружаем первую страницу дополнительных фильмов
  useEffect(() => {
    if (hasMore) loadMore();
  }, []);

  return (
    <>
      {movies.length > 0 && (
        <div className="mt-8">
          <MovieGrid movies={movies} lastMovieRef={lastMovieElementRef} />
        </div>
      )}

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
