"use client";

import Link from "next/link";
import { useCallback } from "react";

interface GenreStripProps {
  title?: string;
}

interface Genre {
  id: number;
  name: string;
}

export default function GenreStrip({ title = "ЖАНРЫ" }: GenreStripProps) {
  // Список жанров для отображения
  const genres: Genre[] = [
    { id: 28, name: "Боевик" },
    { id: 12, name: "Приключения" },
    { id: 16, name: "Мультфильм" },
    { id: 35, name: "Комедия" },
    { id: 80, name: "Криминал" },
    { id: 99, name: "Документальный" },
    { id: 18, name: "Драма" },
    { id: 10751, name: "Семейный" },
    { id: 14, name: "Фэнтези" },
    { id: 36, name: "История" },
    { id: 27, name: "Ужасы" },
    { id: 10402, name: "Музыка" },
    { id: 9648, name: "Детектив" },
    { id: 10749, name: "Мелодрама" },
    { id: 878, name: "Фантастика" },
    { id: 53, name: "Триллер" },
    { id: 10752, name: "Военный" },
    { id: 37, name: "Вестерн" },
  ];

  // Генерируем временную метку для обновления при каждом клике
  const generateTimestamp = useCallback(() => Date.now(), []);

  return (
    <div className="relative px-6">
      <h2 className="text-2xl font-semibold uppercase tracking-wide font-bebas-neue pb-2 relative inline-block">
        {title}
        <div className="absolute bottom-0 h-px w-full bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent"></div>
      </h2>
      <div className="flex items-center justify-start overflow-x-auto gap-3 py-4 scrollbar-hide">
        {genres.map((genre) => (
          <Link
            key={genre.id}
            href={`/discover?with_genres=${
              genre.id
            }&sort_by=popularity.desc&t=${generateTimestamp()}`}
            className="flex-shrink-0"
          >
            <div className="bg-gray-700/80 hover:bg-gray-600/80 transition-colors px-5 py-3 rounded-full text-base font-medium">
              {genre.name}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
