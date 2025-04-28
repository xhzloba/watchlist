import { fetchFromTMDB } from "./tmdb";

// Функция для получения фильмов по одному ключевому слову
export async function fetchMoviesByKeyword(keywordId: number, page = 1) {
  try {
    // Добавляем параметр language=ru-RU для получения русских названий
    const response = await fetchFromTMDB(
      `/keyword/${keywordId}/movies?page=${page}&language=ru-RU`
    );

    // Добавляем информацию о происхождении каждого фильма для дедупликации
    return {
      results: response.results.map((movie: any) => ({
        ...movie,
        keywordSource: keywordId,
      })),
      total_pages: response.total_pages || 1,
      page: response.page || page,
    };
  } catch (error) {
    console.error(
      `Ошибка при получении фильмов для ключевого слова ${keywordId}:`,
      error
    );
    return { results: [], total_pages: 0, page: 1 };
  }
}

// Функция для объединения фильмов из нескольких ключевых слов с поддержкой пагинации
export async function fetchKeywordMovies(
  keywordIds: number[],
  page = 1,
  minVoteCount = 0,
  language = "ru-RU"
) {
  try {
    // Формируем запрос через прокси с помощью fetchFromTMDB
    const queryParams = new URLSearchParams({
      page: page.toString(),
      language,
      with_keywords: keywordIds.join(","),
      sort_by: "popularity.desc",
    });

    // Добавляем фильтр по количеству голосов если нужно
    if (minVoteCount > 0) {
      queryParams.append("vote_count.gte", minVoteCount.toString());
    }

    const response = await fetchFromTMDB(
      `/discover/movie?${queryParams.toString()}`
    );

    console.log(
      `Получено ${response.results.length} фильмов с минимальным рейтингом ${minVoteCount}`
    );

    return response;
  } catch (error) {
    console.error("Ошибка при получении фильмов по ключевым словам:", error);
    // Возвращаем пустой объект вместо выбрасывания ошибки
    return { results: [], total_pages: 0, total_results: 0 };
  }
}

// Функция для получения информации о ключевом слове
export async function getKeywordInfo(keywordId: number) {
  try {
    // Добавляем параметр language=ru-RU для получения русских названий
    return await fetchFromTMDB(`/keyword/${keywordId}?language=ru-RU`);
  } catch (error) {
    console.error(
      `Ошибка при получении информации о ключевом слове ${keywordId}:`,
      error
    );
    return { id: keywordId, name: "Неизвестная категория" };
  }
}
