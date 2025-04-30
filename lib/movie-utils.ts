import { type Movie as LocalMovieType } from "@/lib/tmdb";

/**
 * Преобразует любой movie-like объект в plain object, соответствующий LocalMovieType.
 * Гарантирует, что объект может быть безопасно передан из серверного компонента в клиентский.
 * @param movie - Исходный объект фильма (может быть любого типа).
 * @returns Объект типа LocalMovieType или минимальную структуру в случае ошибки.
 */
export function ensurePlainMovieObject(movie: any): LocalMovieType {
  // Базовая проверка на случай если передали не объект
  if (!movie || typeof movie !== "object") {
    console.warn("ensurePlainMovieObject получил не объект:", movie);
    // Возвращаем минимально необходимую структуру для MovieRow, чтобы избежать ошибок рендера
    return {
      id: Date.now() + Math.random(),
      overview: "",
      poster_path: null,
      backdrop_path: null,
      title: "Ошибка данных",
    };
  }

  // Пытаемся получить все необходимые поля, предоставляя дефолтные значения
  return {
    id: movie.id ?? Date.now() + Math.random(), // Генерируем ID если отсутствует
    title: movie.title ?? movie.name ?? "Без названия",
    name: movie.name ?? movie.title ?? "Без названия",
    overview: movie.overview || "",
    poster_path: movie.posterPath ?? movie.poster_path ?? null,
    backdrop_path: movie.backdropPath ?? movie.backdrop_path ?? null,
    release_date: movie.releaseDate ?? movie.release_date,
    first_air_date: movie.firstAirDate ?? movie.first_air_date,
    // Обработка release_quality для совместимости
    release_quality:
      typeof movie.release_quality === "object" &&
      movie.release_quality !== null
        ? movie.release_quality?.type // Из объекта TMDB
        : movie.release_quality, // Как строка
    releaseQuality: movie.releaseQuality, // Из объекта класса tmdb-xhzloba
    media_type: movie.media_type,
    runtime: movie.runtime,
    vote_average: movie.voteAverage ?? movie.vote_average ?? 0,
    vote_count: movie.voteCount ?? movie.vote_count ?? 0,
    genres: Array.isArray(movie.genres)
      ? movie.genres.map((g: any) => ({
          id: g.id ?? 0,
          name: g.name ?? "Неизвестный",
        }))
      : [],
    director: movie.director,
    popularity: movie.popularity ?? 0,
    character: movie.character,
    status: movie.status,
    job: movie.job,
  };
}

// Можно добавить другие утилиты для работы с фильмами здесь в будущем
