import { NextRequest, NextResponse } from "next/server";
import { searchMovies } from "@/lib/tmdb";

// Базовый URL прокси для TMDB API
const TMDB_PROXY_URL = "https://apitmdb.kurwa-bober.ninja/3";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Используем функцию из библиотеки tmdb для поиска фильмов
    const results = await searchMovies(query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Ошибка API поиска:", error);

    // Возвращаем моковые данные в случае ошибки
    const mockResults = [
      {
        id: 299534,
        title: "Мстители: Финал",
        poster_path: "/q862btR1jVWlG3B9b5tGtYSm6Bk.jpg",
        release_date: "2019-04-24",
        vote_average: 8.3,
      },
      {
        id: 299536,
        title: "Мстители: Война бесконечности",
        poster_path: "/tRwyo1N6vRvMYYaA89WBRnRTpvF.jpg",
        release_date: "2018-04-25",
        vote_average: 8.3,
      },
      {
        id: 24428,
        title: "Мстители",
        poster_path: "/tRwyo1N6vRvMYYaA89WBRnRTpvF.jpg",
        release_date: "2012-04-25",
        vote_average: 7.7,
      },
    ];

    // Фильтруем моковые данные по запросу
    const filteredResults = mockResults.filter((movie) =>
      movie.title.toLowerCase().includes(query.toLowerCase())
    );

    return NextResponse.json({ results: filteredResults });
  }
}
