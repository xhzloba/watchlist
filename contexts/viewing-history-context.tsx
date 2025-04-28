"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

// Определяем типы
type HistoryItem = {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string;
  vote_average?: number;
  overview: string;
  viewed_at: number;
};

interface ViewingHistoryContextProps {
  history: HistoryItem[];
  addToHistory: (item: Omit<HistoryItem, "viewed_at">) => void;
  clearHistory: () => void;
  isInitialized: boolean;
}

const ViewingHistoryContext = createContext<
  ViewingHistoryContextProps | undefined
>(undefined);

export function ViewingHistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Загружаем данные из localStorage при инициализации
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem("viewingHistory");
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Ошибка при загрузке истории просмотров:", error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Обновляем localStorage при изменении истории
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("viewingHistory", JSON.stringify(history));
    }
  }, [history, isInitialized]);

  // Мемоизируем функцию addToHistory с помощью useCallback
  const addToHistory = useCallback((item: Omit<HistoryItem, "viewed_at">) => {
    setHistory((prev) => {
      // Проверяем, есть ли уже этот фильм в истории
      if (prev.some((histItem) => histItem.id === item.id)) {
        // Если фильм уже есть в истории, обновляем его viewed_at и перемещаем в начало
        const filtered = prev.filter((histItem) => histItem.id !== item.id);
        return [{ ...item, viewed_at: Date.now() }, ...filtered];
      }

      // Добавляем новый элемент в начало массива
      const newHistory = [{ ...item, viewed_at: Date.now() }, ...prev];

      // Ограничиваем длину массива до 20 элементов
      return newHistory.slice(0, 20);
    });
  }, []);

  // Мемоизируем функцию clearHistory
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return (
    <ViewingHistoryContext.Provider
      value={{
        history,
        addToHistory,
        clearHistory,
        isInitialized,
      }}
    >
      {children}
    </ViewingHistoryContext.Provider>
  );
}

export function useViewingHistory() {
  const context = useContext(ViewingHistoryContext);
  if (context === undefined) {
    throw new Error(
      "useViewingHistory must be used within a ViewingHistoryProvider"
    );
  }
  return context;
}
