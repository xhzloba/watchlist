import { useState, useEffect } from "react";

interface Movie {
  id: number;
  title?: string;
  original_title?: string;
  release_date?: string;
}

interface KinoboxMovie {
  id: number;
  title: {
    russian: string | null;
    original: string | null;
  };
  year: number;
}

/**
 * Хук для поиска ID фильма на Кинопоиске через API Kinobox
 * @param movie Объект фильма (должен содержать title, original_title и release_date)
 * @returns ID фильма на Кинопоиске или null, если не найден
 */
export function useKinobox(movie: Movie | null) {
  const [kinoboxId, setKinoboxId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Сбрасываем состояние при изменении фильма
    setKinoboxId(null);
    setError(null);

    // Функция для поиска фильма на Kinobox
    async function findMovieOnKinobox() {
      if (!movie || !movie.title) return;

      setIsLoading(true);

      try {
        console.log(`Поиск фильма на Kinobox: "${movie.title}"`);

        // Выполняем запрос к API Kinobox
        const response = await fetch(
          `https://kp.kinobox.tv/films/search/?query=${encodeURIComponent(
            movie.title
          )}`
        );
        const data = await response.json();

        if (
          data &&
          data.data &&
          data.data.items &&
          data.data.items.length > 0
        ) {
          // Выводим все найденные фильмы для отладки
          console.log("Все результаты поиска на Kinobox:", data.data.items);

          // Ищем сначала точное совпадение (по названию И году)
          let exactMatch = null;
          // А также запоминаем первое совпадение только по названию
          let titleOnlyMatch = null;

          // Проходим по всем результатам поиска
          for (const item of data.data.items) {
            // Проверяем название (русское или оригинальное)
            const titleMatches =
              (item.title.russian &&
                movie.title &&
                item.title.russian.toLowerCase() ===
                  movie.title.toLowerCase()) ||
              (item.title.original &&
                movie.original_title &&
                item.title.original.toLowerCase() ===
                  movie.original_title.toLowerCase());

            // Проверяем год выпуска
            const yearMatches =
              item.year &&
              movie.release_date &&
              item.year === parseInt(movie.release_date.substring(0, 4));

            // Выводим информацию о каждом сравниваемом фильме
            console.log(
              `Сравнение: ${item.title.russian || item.title.original} (${
                item.year
              }) с ${movie.title} (${movie.release_date?.substring(0, 4)})`
            );
            console.log(
              `Совпадение названия: ${titleMatches}, совпадение года: ${yearMatches}`
            );

            // Если есть полное совпадение, запоминаем его
            if (titleMatches && yearMatches) {
              exactMatch = item;
              break; // нашли точное совпадение, прекращаем поиск
            }

            // Если совпадает только название, запоминаем первое такое совпадение
            if (titleMatches && !titleOnlyMatch) {
              titleOnlyMatch = item;
            }
          }

          // Сначала используем точное совпадение, если есть
          if (exactMatch) {
            const kinopoiskId = exactMatch.id;
            console.log(
              "Найдено точное совпадение фильма на Kinobox:",
              exactMatch
            );
            console.log(`ID фильма на Кинопоиске: ${kinopoiskId}`);
            setKinoboxId(kinopoiskId);
          }
          // Если точного совпадения нет, но есть совпадение по названию, используем его
          else if (titleOnlyMatch) {
            const kinopoiskId = titleOnlyMatch.id;
            console.log(
              "Найдено совпадение только по названию:",
              titleOnlyMatch
            );
            console.log(
              `Несовпадение по году, но используем ID: ${kinopoiskId}`
            );
            setKinoboxId(kinopoiskId);
          } else {
            console.log("Не найдено совпадений на Kinobox");
            setKinoboxId(null);
          }
        } else {
          console.log("Не найдено результатов на Kinobox");
          setKinoboxId(null);
        }
      } catch (error) {
        console.error("Ошибка при поиске фильма на Kinobox:", error);
        setError("Ошибка при поиске фильма на Kinobox");
        setKinoboxId(null);
      } finally {
        setIsLoading(false);
      }
    }

    findMovieOnKinobox();
  }, [movie]);

  return { kinoboxId, isLoading, error };
}
