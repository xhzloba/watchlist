import { NextRequest, NextResponse } from "next/server";
import { fetchFromTMDB } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Получаем все параметры из URL
  const sortBy = searchParams.get("sort_by") || "popularity.desc";
  const page = searchParams.get("page") || "1";
  const withGenres = searchParams.get("with_genres") || "";
  const trending = searchParams.get("trending");

  // Получаем параметр года (новый короткий формат)
  const year = searchParams.get("year");

  // Получаем параметр страны
  const withOriginCountry = searchParams.get("with_origin_country");

  // Добавляем параметры дат релиза (старый длинный формат)
  const releaseDateGte = searchParams.get("primary_release_date.gte");
  const releaseDateLte = searchParams.get("primary_release_date.lte");

  try {
    let endpoint;

    if (trending) {
      endpoint = `/trending/movie/${trending}?language=ru-RU&page=${page}`;

      // Добавляем жанры к трендам, если они указаны
      if (withGenres && withGenres.trim() !== "") {
        endpoint += `&with_genres=${withGenres}`;
      }
    } else {
      // Базовый URL для discover с улучшенной поддержкой локализации
      endpoint = `/discover/movie?sort_by=${sortBy}&language=ru-RU&include_adult=false&page=${page}&include_image_language=ru,null`;

      // Добавляем фильтр по жанрам
      if (withGenres && withGenres.trim() !== "") {
        endpoint += `&with_genres=${withGenres}`;
      }

      // Добавляем фильтр по стране
      if (withOriginCountry) {
        endpoint += `&with_origin_country=${withOriginCountry}`;
      }

      // Если указан год в коротком формате, используем его
      if (year) {
        // Используем primary_release_year вместо диапазона дат для более точной фильтрации
        endpoint += `&primary_release_year=${year}`;

        // Для будущих релизов (2025 год) добавляем поддержку других языков
        if (year === "2025") {
          // Заменяем только параметр языка, сохраняя остальные фильтры
          endpoint = endpoint.replace("language=ru-RU", "language=ru-RU,en-US");
        }
      }
      // Иначе используем параметры полного формата, если они есть
      else {
        if (releaseDateGte) {
          endpoint += `&primary_release_date.gte=${releaseDateGte}`;
        }

        if (releaseDateLte) {
          endpoint += `&primary_release_date.lte=${releaseDateLte}`;
        }
      }
    }

    const data = await fetchFromTMDB(endpoint);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Ошибка при получении фильмов:", error);
    return NextResponse.json(
      { error: "Не удалось получить фильмы" },
      { status: 500 }
    );
  }
}
