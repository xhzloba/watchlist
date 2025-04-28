import { getActorInfo, getMoviesByActor, getImageUrl } from "./tmdb";

// Типы для актеров
export interface Actor {
  id: number;
  name: string;
  title: string; // Название для заголовка (например, "ФИЛЬМЫ С ДУЭЙНОМ ДЖОНСОНОМ")
}

// Список популярных актеров
export const ACTORS: Actor[] = [
  {
    id: 18918,
    name: "Дуэйн Джонсон",
    title: "Дуэйн Джонсон",
  },
  {
    id: 500,
    name: "Том Круз",
    title: "Том Круз",
  },
  {
    id: 976,
    name: "Джейсон Стейтем",
    title: "Джейсон Стейтем",
  },
  {
    id: 6384,
    name: "Киану Ривз",
    title: "КИАНУ РИВЗ",
  },
  {
    id: 1245,
    name: "Скарлетт Йоханссон",
    title: "СКАРЛЕТТ ЙОХАНССОН",
  },
  {
    id: 18277,
    name: "Сандра Буллок",
    title: "САНДРА БУЛЛОК",
  },
  {
    id: 74568,
    name: "Крис Хемсворт",
    title: "КРИС ХЕМСВОРТ",
  },
  {
    id: 117642,
    name: "Джейсон Момоа",
    title: "Джейсон Момоа",
  },
  {
    id: 12835,
    name: "Вин Дизель",
    title: "Вин Дизель",
  },
  {
    id: 85,
    name: "Джонни Депп",
    title: "Джонни Депп",
  },
];

/**
 * Получает информацию о всех актерах из списка ACTORS
 * @returns Массив с информацией об актерах и URL их изображений
 */
export async function getAllActorsInfo() {
  // Получаем информацию об актерах параллельно
  const actorsInfo = await Promise.all(
    ACTORS.map((actor) => getActorInfo(actor.id))
  );

  // Формируем объект с информацией и URL изображений
  return ACTORS.map((actor, index) => {
    const info = actorsInfo[index];
    const imageUrl =
      info && info.profile_path
        ? getImageUrl(info.profile_path, "w185")
        : undefined;

    return {
      ...actor,
      info,
      imageUrl,
    };
  });
}

/**
 * Получает фильмы для всех актеров из списка ACTORS
 * @returns Объект, где ключи - это ID актеров, а значения - массивы их фильмов
 */
export async function getAllActorsMovies() {
  // Получаем фильмы для всех актеров параллельно
  const actorsMovies = await Promise.all(
    ACTORS.map((actor) => getMoviesByActor(actor.id))
  );

  // Формируем объект с ID актера в качестве ключа
  const moviesMap: Record<number, any[]> = {};

  ACTORS.forEach((actor, index) => {
    moviesMap[actor.id] = actorsMovies[index];
  });

  return moviesMap;
}
