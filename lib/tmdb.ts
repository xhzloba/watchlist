export interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  release_quality?: string | { type?: string };
  first_air_date?: string;
  media_type?: string;
  runtime?: number;
  vote_average?: number;
  vote_count?: number;
  genres?: { id: number; name: string }[];
  director?: string;
  popularity?: number;
  character?: string;
  status?: string;
  job?: string;
}

export interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const API_BASE_URL = process.env.NEXT_PUBLIC_TMDB_API_BASE_URL;
const IMAGE_BASE_URL = "https://imagetmdb.com/t/p";

export async function getTrendingMovies(): Promise<Movie[]> {
  const response = await fetch(
    `${API_BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=ru`,
    {
      next: { revalidate: 1000 },
    }
  );
  const data = await response.json();
  return data.results;
}

export async function getUpcomingMovies(): Promise<Movie[]> {
  const response = await fetch(
    `${API_BASE_URL}/movie/upcoming?api_key=${API_KEY}&language=ru`,
    {
      next: { revalidate: 1000 },
    }
  );
  const data = await response.json();
  return data.results;
}

export async function getNowPlayingMovies(): Promise<Movie[]> {
  const response = await fetch(
    `${API_BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=ru`,
    {
      next: { revalidate: 1000 },
    }
  );
  const data = await response.json();
  console.log("rrrr", data.results);
  return data.results;
}

export function getImageUrl(path: string, size = "w500"): string {
  if (!path) return "/placeholder.svg?height=300&width=200";

  // Если путь уже является полным URL, возвращаем его как есть
  if (path.startsWith("http")) return path;

  // Если путь начинается с "/", убираем слеш в начале
  const cleanPath = path.startsWith("/") ? path.substring(1) : path;

  return `${IMAGE_BASE_URL}/${size}/${cleanPath}`;
}

export function getYear(date?: string): string {
  if (!date) return "Дата неизвестна";
  try {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return "Дата неизвестна";
    return parsedDate.getFullYear().toString();
  } catch (e) {
    return "Дата неизвестна";
  }
}

export function formatDate(
  dateString?: string,
  includeYear: boolean = false
): string {
  if (!dateString) return "Дата выхода неизвестна";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Дата выхода неизвестна";

    const month = date.toLocaleString("ru-RU", { month: "long" });
    const day = date.getDate();
    const year = date.getFullYear();

    // Вместо падежа, используем именительный падеж с родительным для месяца
    if (includeYear) {
      return `${day} ${month} ${year}`;
    } else {
      return `${day} ${month}`;
    }
  } catch (e) {
    return "Дата выхода неизвестна";
  }
}

export async function getMovieVideos(movieId: string): Promise<any[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&include_video_language=ru,en,null`,
      { next: { revalidate: 1000 } }
    );
    const data = await response.json();

    // Сортируем видео, чтобы русские были первыми, затем английские
    const results = data.results || [];
    return results.sort((a: any, b: any) => {
      if (a.iso_639_1 === "ru" && b.iso_639_1 !== "ru") return -1;
      if (a.iso_639_1 !== "ru" && b.iso_639_1 === "ru") return 1;
      if (a.iso_639_1 === "en" && b.iso_639_1 !== "en") return -1;
      if (a.iso_639_1 !== "en" && b.iso_639_1 === "en") return 1;
      return 0;
    });
  } catch (error) {
    console.error("Ошибка при получении видео фильма:", error);
    return [];
  }
}

export async function getMovieDetail(id: string): Promise<any> {
  try {
    if (!id || isNaN(Number(id))) {
      console.error(`Некорректный ID фильма: ${id}`);
      throw new Error(`Некорректный ID фильма: ${id}`);
    }

    const response = await fetch(
      `${API_BASE_URL}/movie/${id}?` +
        `api_key=${API_KEY}&` +
        `language=ru-RU&` +
        `append_to_response=credits,videos,images&` +
        `include_image_language=ru,en,null`,
      {
        next: { revalidate: 0 },
      }
    );

    if (!response.ok) {
      console.error(
        `Ошибка API при получении фильма ${id}: ${response.status} ${response.statusText}`
      );

      // Если получили 404, возвращаем объект с данными об ошибке
      if (response.status === 404) {
        return {
          id: Number(id),
          title: "Фильм не найден",
          overview:
            "Информация о фильме недоступна. Возможно, фильм был удален из базы данных.",
          poster_path: null,
          backdrop_path: null,
          error: true,
          status_code: 404,
        };
      }

      // Для других ошибок пробуем прочитать текст ошибки
      try {
        const errorData = await response.json();
        console.error("Детали ошибки API:", errorData);
      } catch (e) {
        // Игнорируем ошибку при чтении ответа
      }

      throw new Error(`Ошибка API: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Ошибка при получении данных о фильме:", error);
    throw error;
  }
}

export async function getMovieCredits(id: string): Promise<Cast[]> {
  const response = await fetch(
    `${API_BASE_URL}/movie/${id}/credits?api_key=${API_KEY}&language=ru`,
    {
      next: { revalidate: 2600 },
    }
  );
  const data = await response.json();
  return data.cast;
}

export async function searchMovies(query: string) {
  const TMDB_SEARCH_PROXY = process.env.NEXT_PUBLIC_TMDB_API_BASE_URL;
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  // Формируем URL для поиска через прокси
  const url =
    `${TMDB_SEARCH_PROXY}/search/movie?` +
    `api_key=${API_KEY}&` +
    `query=${encodeURIComponent(query)}&` +
    `language=ru-RU&` +
    `region=RU&` +
    `include_adult=false`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Ошибка API: ${res.status}, Текст: ${errorText}`);
      throw new Error(`Ошибка поиска фильмов: ${res.status}`);
    }

    const data = await res.json();
    console.log("Результаты поиска:", data);

    // Добавляем поиск по оригинальному названию
    const results = data.results || [];
    return results.filter((movie: any) => {
      const titleMatch = movie.title
        ?.toLowerCase()
        .includes(query.toLowerCase());
      const originalTitleMatch = movie.original_title
        ?.toLowerCase()
        .includes(query.toLowerCase());
      return titleMatch || originalTitleMatch;
    });
  } catch (error) {
    console.error("Ошибка при поиске фильмов:", error);
    throw error;
  }
}

// Функция для получения всех фильмов
export async function getAllMovies() {
  try {
    // Получаем несколько страниц популярных фильмов для создания большой коллекции
    const [page1, page2, page3] = await Promise.all([
      fetchFromTMDB("/movie/popular?page=1"),
      fetchFromTMDB("/movie/popular?page=2"),
      fetchFromTMDB("/movie/popular?page=3"),
    ]);

    // Объединяем результаты
    const allMovies = [...page1.results, ...page2.results, ...page3.results];

    return allMovies;
  } catch (error) {
    console.error("Ошибка при получении всех фильмов:", error);
    return [];
  }
}

export async function fetchFromTMDB(endpoint: string) {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const API_BASE_URL = process.env.NEXT_PUBLIC_TMDB_API_BASE_URL;

  const url = `${API_BASE_URL}${endpoint}${
    endpoint.includes("?") ? "&" : "?"
  }api_key=${API_KEY}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 1000 },
    });

    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Ошибка при запросе к TMDB (${endpoint}):`, error);
    throw error;
  }
}

// Изменяем функцию getLatestTrailers на getPopularTrailers
export async function getLatestTrailers(): Promise<Movie[]> {
  try {
    // Получаем популярные фильмы через discover
    const response = await fetch(
      `${API_BASE_URL}/discover/movie?` +
        `api_key=${API_KEY}&` +
        `language=ru&` +
        `sort_by=popularity.desc&` + // Сортировка по популярности
        `include_adult=false&` +
        `page=1`
    );

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Ошибка при получении популярных фильмов:", error);
    return [];
  }
}

export async function getMovieRecommendations(movieId: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/movie/${movieId}/recommendations?` +
        `api_key=${API_KEY}&` +
        `language=ru-RU`,
      {
        next: { revalidate: 2600 }, // Обновлять кэш каждый час
      }
    );

    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Ошибка при получении рекомендаций:", error);
    return { results: [] };
  }
}

export async function getMovieSimilar(movieId: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/movie/${movieId}/similar?` +
        `api_key=${API_KEY}&` +
        `language=ru-RU`,
      {
        next: { revalidate: 2600 }, // Обновлять кэш каждый час
      }
    );

    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Ошибка при получении похожих фильмов:", error);
    return { results: [] };
  }
}

export async function getMovieImages(movieId: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/movie/${movieId}/images?` +
        `api_key=${API_KEY}&` +
        `include_image_language=ru,null`,
      {
        next: { revalidate: 0 },
      }
    );

    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Ошибка при получении изображений фильма:", error);
    return { backdrops: [], posters: [] };
  }
}

// Добавляем алиас для функции getMovieDetail
export const getMovieDetails = getMovieDetail;

// Функция для получения информации о коллекции
export async function getMovieCollection(collectionId: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/collection/${collectionId}?` +
        `api_key=${API_KEY}&` +
        `language=ru-RU`,
      {
        next: { revalidate: 2600 },
      }
    );

    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Ошибка при получении коллекции:", error);
    return { parts: [] };
  }
}

// Добавляем функцию для получения данных о возрастном рейтинге фильма
export async function getMovieCertification(movieId: string): Promise<string> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/movie/${movieId}/release_dates?api_key=${API_KEY}`,
      {
        next: { revalidate: 2600 }, // Обновлять кэш каждый час
      }
    );

    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.status}`);
    }

    const data = await response.json();

    // Ищем сертификацию для России (RU)
    let certification = "N/A";
    const results = data.results || [];

    // Приоритет: Россия, затем США
    const ruRelease = results.find(
      (country: any) => country.iso_3166_1 === "RU"
    );
    const usRelease = results.find(
      (country: any) => country.iso_3166_1 === "US"
    );

    if (
      ruRelease &&
      ruRelease.release_dates &&
      ruRelease.release_dates.length > 0
    ) {
      // Берем первую сертификацию из России
      const cert = ruRelease.release_dates.find(
        (date: any) => date.certification && date.certification !== ""
      );
      if (cert) {
        certification = cert.certification;
      }
    } else if (
      usRelease &&
      usRelease.release_dates &&
      usRelease.release_dates.length > 0
    ) {
      // Если нет RU, берем из США
      const cert = usRelease.release_dates.find(
        (date: any) => date.certification && date.certification !== ""
      );
      if (cert) {
        certification = cert.certification;
      }
    }

    return certification;
  } catch (error) {
    console.error("Ошибка при получении сертификации фильма:", error);
    return "N/A";
  }
}

/**
 * Получает информацию о фильмах по списку ID
 */
export async function getMoviesByIds(movieIds: number[]): Promise<Movie[]> {
  try {
    console.log("Запрашиваем фильмы с ID:", movieIds);

    // Создаем массив промисов для параллельного запроса информации о каждом фильме
    const requests = movieIds.map((id) =>
      fetch(
        `${API_BASE_URL}/movie/${id}?api_key=${API_KEY}&language=ru-RU&append_to_response=images,videos`
      )
        .then((res) => {
          console.log(`Статус ответа для фильма ${id}:`, res.status);
          if (!res.ok) {
            console.error(
              `Ошибка получения фильма с ID ${id}. Статус: ${res.status}`
            );
            return null; // Возвращаем null вместо выброса исключения, чтобы не блокировать другие запросы
          }
          return res.json();
        })
        .catch((error) => {
          console.error(`Ошибка запроса для фильма ${id}:`, error);
          return null;
        })
    );

    // Ждем выполнения всех запросов
    const results = await Promise.all(requests);

    console.log(
      "Результаты запроса фильмов по ID (количество):",
      results.length
    );
    console.log(
      "Успешно полученные результаты:",
      results.filter((r) => r !== null).length
    );

    // Проверяем наличие фильмов в результатах
    if (results.every((r) => r === null)) {
      console.error("Все запрашиваемые фильмы вернули ошибку или null");
      return [];
    }

    // Фильтруем и преобразуем результаты
    const movies = results
      .filter((movie) => movie && movie.id)
      .map((movie) => ({
        id: movie.id,
        title: movie.title,
        overview: movie.overview || "",
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        release_date: movie.release_date || "",
        vote_average: movie.vote_average || 0,
        vote_count: movie.vote_count || 0,
        popularity: movie.popularity || 0,
        genres: movie.genres || [],
        runtime: movie.runtime || 0,
      }));

    console.log(`Успешно обработано ${movies.length} фильмов`);
    return movies;
  } catch (error) {
    console.error("Ошибка при получении фильмов по ID:", error);
    return [];
  }
}

/**
 * Получает фильмы по указанному жанру
 * @param genreId ID жанра (например, 35 для комедий)
 * @param page Номер страницы для запроса
 * @returns Список фильмов указанного жанра
 */
export async function getMoviesByGenre(
  genreId: number,
  page: number = 1
): Promise<Movie[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/discover/movie?` +
        `api_key=${API_KEY}&` +
        `language=ru-RU&` +
        `with_genres=${genreId}&` +
        `sort_by=popularity.desc&` +
        `page=${page}`,
      {
        next: { revalidate: 1000 },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Ошибка API при получении фильмов жанра ${genreId}: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("data", data);
    return data.results || [];
  } catch (error) {
    console.error(`Ошибка при получении фильмов жанра ${genreId}:`, error);
    return [];
  }
}

/**
 * Получает фильмы с участием конкретного актера
 * @param actorId ID актера в TMDB
 * @returns Список фильмов с участием актера, отсортированных по популярности
 */
export async function getMoviesByActor(actorId: number): Promise<Movie[]> {
  try {
    console.log(`Запрашиваем фильмы для актера с ID: ${actorId}`);

    // Сначала получаем фильмографию актера
    const response = await fetch(
      `${API_BASE_URL}/person/${actorId}/movie_credits?` +
        `api_key=${API_KEY}&` +
        `language=ru-RU`,
      {
        next: { revalidate: 3600 }, // Кеширование на 1 час
      }
    );

    if (!response.ok) {
      console.error(
        `Ошибка API при получении фильмов актера ${actorId}: ${response.status}`
      );
      throw new Error(
        `Ошибка API при получении фильмов с участием актера ${actorId}: ${response.status}`
      );
    }

    const data = await response.json();
    console.log(
      `Получены данные актера ${actorId}. Количество фильмов: ${
        data.cast?.length || 0
      }`
    );

    // Проверяем, что data.cast существует и это массив
    if (!data.cast || !Array.isArray(data.cast) || data.cast.length === 0) {
      console.error(
        `Не найдены фильмы для актера ${actorId} или некорректный формат данных`
      );
      return [];
    }

    // Включаем все фильмы, где актер был в актерском составе (cast)
    const movies = data.cast.filter((movie: any) => movie);

    console.log(
      `Всего ${movies.length} фильмов для актера ${actorId} (включая фильмы в пост-продакшене и без постеров)`
    );

    // Сортируем по популярности
    const sortedMovies = movies
      .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
      .map((movie: any) => ({
        id: movie.id,
        title: movie.title,
        overview: movie.overview || "",
        poster_path: movie.poster_path || null, // Разрешаем null для постера
        backdrop_path: movie.backdrop_path || null, // Разрешаем null для бэкдропа
        release_date: movie.release_date || "",
        vote_average: movie.vote_average || 0,
        vote_count: movie.vote_count || 0,
        popularity: movie.popularity || 0,
        character: movie.character || "",
        status: movie.status || "", // Добавляем статус фильма если доступен
      }));

    console.log(
      `Итоговый список фильмов актера ${actorId} содержит ${sortedMovies.length} элементов`
    );
    return sortedMovies;
  } catch (error) {
    console.error(`Ошибка при получении фильмов актера ${actorId}:`, error);
    return [];
  }
}

/**
 * Получает информацию об актере
 * @param actorId ID актера в TMDB
 * @returns Информация об актере, включая фото
 */
export async function getActorInfo(actorId: number) {
  try {
    console.log(`Запрашиваем информацию об актере с ID: ${actorId}`);

    const response = await fetch(
      `${API_BASE_URL}/person/${actorId}?` +
        `api_key=${API_KEY}&` +
        `language=ru-RU`,
      {
        next: { revalidate: 3600 }, // Кеширование на 1 час
      }
    );

    if (!response.ok) {
      console.error(
        `Ошибка API при получении информации об актере ${actorId}: ${response.status}`
      );
      throw new Error(
        `Ошибка API при получении информации об актере ${actorId}: ${response.status}`
      );
    }

    const data = await response.json();
    console.log(`Получена информация об актере ${actorId}`);

    return data;
  } catch (error) {
    console.error(
      `Ошибка при получении информации об актере ${actorId}:`,
      error
    );
    return null;
  }
}

/**
 * Получает внешние идентификаторы актера, включая социальные сети
 * @param actorId ID актера в TMDB
 * @returns Объект с идентификаторами социальных сетей актера (instagram_id, facebook_id, twitter_id и др.)
 */
export async function getActorExternalIds(actorId: number) {
  try {
    console.log(`Запрашиваем внешние ID актера с ID: ${actorId}`);

    const response = await fetch(
      `${API_BASE_URL}/person/${actorId}/external_ids?` + `api_key=${API_KEY}`,
      {
        next: { revalidate: 3600 }, // Кеширование на 1 час
      }
    );

    if (!response.ok) {
      console.error(
        `Ошибка API при получении внешних ID актера ${actorId}: ${response.status}`
      );
      throw new Error(
        `Ошибка API при получении внешних ID актера ${actorId}: ${response.status}`
      );
    }

    const data = await response.json();
    console.log(`Получены внешние ID актера ${actorId}`);

    return data;
  } catch (error) {
    console.error(`Ошибка при получении внешних ID актера ${actorId}:`, error);
    return null;
  }
}

/**
 * Получает лучшие фильмы 2025 года по количеству голосов
 * @returns Список фильмов 2025 года, отсортированных по количеству голосов
 */
export async function getBestMoviesOf2025(): Promise<Movie[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/discover/movie?` +
        `api_key=${API_KEY}&` +
        `language=ru-RU&` +
        `primary_release_year=2025&` +
        `sort_by=vote_count.desc&` +
        `page=1`,
      {
        next: { revalidate: 1000 },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Ошибка API при получении фильмов 2025 года: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("Получены фильмы 2025 года по голосам:", data);
    return data.results || [];
  } catch (error) {
    console.error("Ошибка при получении фильмов 2025 года:", error);
    return [];
  }
}

/**
 * Получает лучшие фильмы 2024 года по количеству голосов
 * @returns Список фильмов 2024 года, отсортированных по количеству голосов
 */
export async function getBestMoviesOf2024(): Promise<Movie[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/discover/movie?` +
        `api_key=${API_KEY}&` +
        `language=ru-RU&` +
        `primary_release_year=2024&` +
        `sort_by=vote_count.desc&` +
        `page=1`,
      {
        next: { revalidate: 1000 },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Ошибка API при получении фильмов 2025 года: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("Получены фильмы 2025 года по голосам:", data);
    return data.results || [];
  } catch (error) {
    console.error("Ошибка при получении фильмов 2025 года:", error);
    return [];
  }
}

/**
 * Получает логотипы фильма по ID
 * @param movieId ID фильма
 * @returns Объект с массивом логотипов
 */
export async function getMovieLogos(movieId: number | string): Promise<any> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/movie/${movieId}/images?` +
        `api_key=${API_KEY}&` +
        `include_image_language=ru,en,null`,
      {
        next: { revalidate: 0 },
      }
    );

    if (!response.ok) {
      throw new Error(`Ошибка API при получении логотипов: ${response.status}`);
    }

    const data = await response.json();

    // Получаем логотипы и сортируем по приоритету языка
    const logos = data.logos || [];
    const sortedLogos = [...logos].sort((a, b) => {
      if (a.iso_639_1 === "ru" && b.iso_639_1 !== "ru") return -1;
      if (a.iso_639_1 !== "ru" && b.iso_639_1 === "ru") return 1;
      if (a.iso_639_1 === "en" && b.iso_639_1 !== "en") return -1;
      if (a.iso_639_1 !== "en" && b.iso_639_1 === "en") return 1;
      return 0;
    });

    return { logos: sortedLogos };
  } catch (error) {
    console.error(`Ошибка при получении логотипов фильма ${movieId}:`, error);
    return { logos: [] };
  }
}

/**
 * Получает популярные фильмы из России
 * @returns Список популярных фильмов из России, отсортированных по популярности
 */
export async function getRussianMovies(): Promise<Movie[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/discover/movie?` +
        `api_key=${API_KEY}&` +
        `language=ru-RU&` +
        `with_origin_country=RU&` +
        `sort_by=popularity.desc&` +
        `page=1`,
      {
        next: { revalidate: 1000 },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Ошибка API при получении популярных фильмов из России: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("Получены популярные фильмы из России:", data);
    return data.results || [];
  } catch (error) {
    console.error("Ошибка при получении популярных фильмов из России:", error);
    return [];
  }
}

/**
 * Получает список популярных актеров с пагинацией
 * @param page Номер страницы (по умолчанию 1)
 * @returns Объект с актерами и информацией о пагинации
 */
export async function getPopularActors(page: number = 1): Promise<{
  actors: any[];
  total_pages: number;
  total_results: number;
  page: number;
}> {
  try {
    console.log(`Запрашиваем популярных актеров (страница ${page})`);

    const response = await fetch(
      `${API_BASE_URL}/person/popular?` +
        `api_key=${API_KEY}&` +
        `language=ru-RU&` +
        `page=${page}`,
      {
        next: { revalidate: 3600 }, // Кеширование на 1 час
      }
    );

    if (!response.ok) {
      console.error(
        `Ошибка API при получении популярных актеров: ${response.status}`
      );
      throw new Error(
        `Ошибка API при получении популярных актеров: ${response.status}`
      );
    }

    const data = await response.json();
    console.log(
      `Получены популярные актеры (страница ${page}). Количество: ${
        data.results?.length || 0
      }`
    );

    // Обрабатываем результаты - добавляем URL изображений и прочие детали
    const actors = data.results.map((actor: any) => ({
      id: actor.id,
      name: actor.name,
      profile_path: actor.profile_path,
      popularity: actor.popularity,
      imageUrl: actor.profile_path
        ? getImageUrl(actor.profile_path, "w185")
        : null,
      known_for: actor.known_for || [],
    }));

    return {
      actors,
      total_pages: data.total_pages || 1,
      total_results: data.total_results || 0,
      page: data.page || page,
    };
  } catch (error) {
    console.error(`Ошибка при получении популярных актеров:`, error);
    return { actors: [], total_pages: 1, total_results: 0, page };
  }
}

/**
 * Получает изображения актера по ID
 * @param actorId ID актера
 * @returns Массив URL изображений актера
 */
export async function getActorImages(actorId: number): Promise<any> {
  try {
    console.log(`Запрашиваем изображения актера с ID: ${actorId}`);

    const response = await fetch(
      `${API_BASE_URL}/person/${actorId}/images?` + `api_key=${API_KEY}`,
      {
        next: { revalidate: 3600 }, // Кеширование на 1 час
      }
    );

    if (!response.ok) {
      console.error(
        `Ошибка API при получении изображений актера ${actorId}: ${response.status}`
      );
      throw new Error(
        `Ошибка API при получении изображений актера ${actorId}: ${response.status}`
      );
    }

    const data = await response.json();
    console.log(
      `Получены изображения актера ${actorId}. Количество: ${
        data.profiles?.length || 0
      }`
    );

    // Отфильтровываем изображения и убеждаемся, что каждое содержит file_path
    if (data.profiles && Array.isArray(data.profiles)) {
      return data.profiles.filter((image: any) => image.file_path);
    }

    return [];
  } catch (error) {
    console.error(`Ошибка при получении изображений актера ${actorId}:`, error);
    return [];
  }
}

/**
 * Получает фильмы, где человек был продюсером или участником команды фильма
 * @param personId ID человека в TMDB
 * @returns Список фильмов, где человек был продюсером или режиссером
 */
export async function getActorAsProducer(personId: number): Promise<Movie[]> {
  try {
    console.log(
      `Запрашиваем фильмы, где человек с ID ${personId} был продюсером`
    );

    // Запрашиваем список фильмов для команды производства
    const response = await fetch(
      `${API_BASE_URL}/person/${personId}/movie_credits?` +
        `api_key=${API_KEY}&` +
        `language=ru-RU`,
      {
        next: { revalidate: 3600 }, // Кеширование на 1 час
      }
    );

    if (!response.ok) {
      console.error(
        `Ошибка API при получении данных о продюсерских работах для ${personId}: ${response.status}`
      );
      throw new Error(
        `Ошибка API при получении данных о продюсерских работах для ${personId}: ${response.status}`
      );
    }

    const data = await response.json();

    // Проверяем, что data.crew существует и это массив
    if (!data.crew || !Array.isArray(data.crew) || data.crew.length === 0) {
      console.log(`Не найдены продюсерские работы для ${personId}`);
      return [];
    }

    // Фильтруем только продюсерские работы
    const producerJobs = data.crew.filter((item: any) => {
      const job = item.job?.toLowerCase() || "";
      return job.includes("produc") || job.includes("продюс");
    });

    console.log(
      `Найдено ${producerJobs.length} продюсерских работ для ${personId}`
    );

    // Преобразуем в формат Movie
    const producerMovies = producerJobs
      .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
      .map((movie: any) => ({
        id: movie.id,
        title: movie.title,
        overview: movie.overview || "",
        poster_path: movie.poster_path || null,
        backdrop_path: movie.backdrop_path || null,
        release_date: movie.release_date || "",
        vote_average: movie.vote_average || 0,
        vote_count: movie.vote_count || 0,
        popularity: movie.popularity || 0,
        job: movie.job || "", // Добавляем роль (Executive Producer, Producer, и т.д.)
        status: movie.status || "",
      }));

    return producerMovies;
  } catch (error) {
    console.error(
      `Ошибка при получении продюсерских работ для ${personId}:`,
      error
    );
    return [];
  }
}

/**
 * Поиск актеров по имени
 * @param query Строка поиска
 * @param page Номер страницы (по умолчанию 1)
 * @returns Список актеров, соответствующих запросу
 */
export async function searchActors(
  query: string,
  page: number = 1
): Promise<{
  actors: any[];
  total_pages: number;
  total_results: number;
  page: number;
}> {
  try {
    if (!query.trim()) {
      return { actors: [], total_pages: 0, total_results: 0, page };
    }

    console.log(`Поиск актеров по запросу "${query}", страница ${page}`);

    const response = await fetch(
      `${API_BASE_URL}/search/person?` +
        `api_key=${API_KEY}&` +
        `language=ru-RU&` +
        `query=${encodeURIComponent(query)}&` +
        `page=${page}&` +
        `include_adult=false`,
      {
        next: { revalidate: 300 }, // Кеширование на 5 минут
      }
    );

    if (!response.ok) {
      console.error(`Ошибка API при поиске актеров: ${response.status}`);
      throw new Error(`Ошибка API при поиске актеров: ${response.status}`);
    }

    const data = await response.json();
    console.log(
      `Найдено актеров по запросу "${query}": ${
        data.total_results || 0
      }, страница ${page} из ${data.total_pages || 0}`
    );

    // Обрабатываем результаты - добавляем URL изображений и прочие детали
    const actors = data.results.map((actor: any) => ({
      id: actor.id,
      name: actor.name,
      profile_path: actor.profile_path,
      popularity: actor.popularity,
      imageUrl: actor.profile_path
        ? getImageUrl(actor.profile_path, "w185")
        : null,
      known_for: actor.known_for || [],
    }));

    return {
      actors,
      total_pages: data.total_pages || 0,
      total_results: data.total_results || 0,
      page: data.page || page,
    };
  } catch (error) {
    console.error(`Ошибка при поиске актеров:`, error);
    return { actors: [], total_pages: 0, total_results: 0, page };
  }
}

/**
 * Получает список сериалов, в которых снимался актер
 * @param actorId ID актера в TMDB
 * @returns Массив сериалов с участием актера
 */
export async function getTVByActor(actorId: number): Promise<Movie[]> {
  try {
    console.log(`Запрашиваем сериалы для актера с ID: ${actorId}`);

    // Получаем список сериалов с участием актера
    const response = await fetch(
      `${API_BASE_URL}/person/${actorId}/tv_credits?` +
        `api_key=${API_KEY}&` +
        `language=ru-RU`,
      {
        next: { revalidate: 3600 }, // Кеширование на 1 час
      }
    );

    if (!response.ok) {
      console.error(
        `Ошибка API при получении сериалов актера ${actorId}: ${response.status}`
      );
      throw new Error(
        `Ошибка API при получении сериалов с участием актера ${actorId}: ${response.status}`
      );
    }

    const data = await response.json();
    console.log(
      `Получены данные о сериалах актера ${actorId}. Количество сериалов: ${
        data.cast?.length || 0
      }`
    );

    // Проверяем, что data.cast существует и это массив
    if (!data.cast || !Array.isArray(data.cast) || data.cast.length === 0) {
      console.log(
        `Не найдены сериалы для актера ${actorId} или некорректный формат данных`
      );
      return [];
    }

    // Включаем все сериалы, где актер был в актерском составе (cast)
    const tvShows = data.cast.filter((show: any) => show);

    console.log(`Всего ${tvShows.length} сериалов для актера ${actorId}`);

    // Сортируем по популярности
    const sortedTVShows = tvShows
      .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
      .map((show: any) => ({
        id: show.id,
        title: show.name, // Для сериалов используется поле name вместо title
        overview: show.overview || "",
        poster_path: show.poster_path || null,
        backdrop_path: show.backdrop_path || null,
        first_air_date: show.first_air_date || "", // Для сериалов первая дата выхода
        vote_average: show.vote_average || 0,
        vote_count: show.vote_count || 0,
        popularity: show.popularity || 0,
        character: show.character || "",
        status: show.status || "",
        media_type: "tv", // Добавляем тип медиа для отличия от фильмов
      }));

    console.log(
      `Итоговый список сериалов актера ${actorId} содержит ${sortedTVShows.length} элементов`
    );
    return sortedTVShows;
  } catch (error) {
    console.error(`Ошибка при получении сериалов актера ${actorId}:`, error);
    return [];
  }
}
