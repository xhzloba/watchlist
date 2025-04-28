import { useState, useEffect } from "react";

export interface Discussion {
  id: number;
  cid: number;
  card_id: string;
  published: number;
  comment: string;
  liked: number;
  lang: string;
  email: string;
  profile: number;
  icon: string;
}

interface DiscussionsResponse {
  secuses: boolean;
  total: number;
  total_pages: number;
  page: number;
  result: Discussion[];
}

/**
 * Хук для получения обсуждений фильма
 * @param movieId ID фильма
 * @returns Объект с обсуждениями и состоянием загрузки
 */
export function useDiscussions(movieId: number | null) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDiscussions() {
      if (!movieId) {
        setDiscussions([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const url = `https://kurwa-bober.ninja/api/discuss/get/movie_${movieId}/1/ru`;
        console.log("Запрашиваем обсуждения по URL:", url);

        const response = await fetch(url);
        const data: DiscussionsResponse = await response.json();

        if (data.secuses && data.result) {
          console.log(`Получено ${data.result.length} обсуждений`);
          setDiscussions(data.result);
        } else {
          console.log("Обсуждения не найдены или ошибка API");
          setDiscussions([]);
        }
      } catch (error) {
        console.error("Ошибка при получении обсуждений:", error);
        setError("Ошибка при получении обсуждений");
        setDiscussions([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDiscussions();
  }, [movieId]);

  return { discussions, isLoading, error };
}
