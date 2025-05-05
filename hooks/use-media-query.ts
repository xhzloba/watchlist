"use client";

import { useState, useEffect } from "react";

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Проверяем, что мы в браузере
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia(query);
    // Устанавливаем начальное значение
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => {
      setMatches(media.matches);
    };

    // Добавляем слушателя (используем новый метод, если доступен)
    if (media.addEventListener) {
      media.addEventListener("change", listener);
    } else {
      // Устаревший метод для старых браузеров
      media.addListener(listener);
    }

    // Убираем слушателя при размонтировании
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [matches, query]); // Добавляем query и matches в зависимости

  return matches;
}

export default useMediaQuery;
