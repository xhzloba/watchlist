"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

// Клиентский компонент с бесконечным скроллом
export default function ActorsClientPage({
  initialActors,
  totalPages = 500, // TMDB API обычно имеет много страниц
}: {
  initialActors: any[];
  totalPages?: number;
}) {
  const [actors, setActors] = useState<any[]>(initialActors);
  const [page, setPage] = useState(2); // Начинаем со второй страницы, т.к. первую уже загрузили
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Хук для отслеживания, когда элемент входит в область видимости
  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  // Эффект для подгрузки дополнительных актеров
  useEffect(() => {
    if (inView && hasMoreData && !isLoading) {
      loadMoreActors();
    }
  }, [inView, hasMoreData, isLoading]);

  // Функция загрузки дополнительных актеров
  const loadMoreActors = async () => {
    if (page > totalPages) {
      setHasMoreData(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Реальный запрос к API через Next.js API route
      const response = await fetch(`/api/actors?page=${page}`);

      if (!response.ok) {
        throw new Error(`Ошибка при загрузке актеров: ${response.status}`);
      }

      const data = await response.json();

      if (data.actors && data.actors.length > 0) {
        setActors((prev) => [...prev, ...data.actors]);
        setPage((prev) => prev + 1);
      } else {
        setHasMoreData(false);
      }
    } catch (err) {
      console.error("Ошибка при загрузке актеров:", err);
      setError(
        "Не удалось загрузить больше актеров. Пожалуйста, попробуйте позже."
      );
      setHasMoreData(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 sm:gap-5">
        {actors.map((actor) => (
          <Link
            key={actor.id}
            href={`/actors/${actor.id}`}
            className="block group"
          >
            <div className="flex flex-col items-center">
              <div
                className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-2 transition-all duration-300 
                group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-white/20 group-hover:brightness-110
                border-2 border-white/20 group-hover:border-white/70"
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 z-10 rounded-full"></div>
                {actor.imageUrl ? (
                  <Image
                    src={actor.imageUrl}
                    alt={actor.name}
                    fill
                    sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, 96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                )}
              </div>
              <div className="text-center text-white text-xs sm:text-sm truncate w-full group-hover:text-yellow-400 transition-colors duration-200">
                {actor.name}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Скрытый элемент для отслеживания и загрузки новых актеров без визуальных индикаторов */}
      <div ref={ref} className="h-20 w-full"></div>
    </div>
  );
}
