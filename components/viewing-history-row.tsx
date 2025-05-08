"use client";

import { useEffect, useState } from "react";
import MovieRow from "./movie-row";
import { useViewingHistory } from "@/contexts/viewing-history-context";
import { History } from "lucide-react";

export default function ViewingHistoryRow() {
  const { history, isInitialized } = useViewingHistory();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);

    // Имитируем небольшую задержку загрузки для отображения лоадера
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  // Показываем лоадер, пока данные инициализируются
  if (!mounted || !isInitialized) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">История просмотров</h2>
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
        </div>
      </div>
    );
  }

  // Если история пуста после инициализации, возвращаем пустой блок
  if (history.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 relative">
          <History className="w-6 h-6 text-yellow-500" />
          <h2 className="text-xl uppercase tracking-wide font-exo-2 pb-2 pr-8 relative border-b border-transparent">
            ИСТОРИЯ ПРОСМОТРОВ
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent"></div>
          </h2>
        </div>
        <div className="text-center py-4 text-gray-400">
          Вы еще не смотрели ни одного фильма
        </div>
      </div>
    );
  }

  // Основной контент - история просмотров
  return (
    <MovieRow
      title="ИСТОРИЯ ПРОСМОТРОВ"
      items={history}
      variant="backdrop"
      showDate
      showYear
      emptyMessage="История просмотров пуста"
      titleIcon={<History className="w-6 h-6 text-yellow-500" />}
      titleFontClass="font-exo-2"
    />
  );
}
