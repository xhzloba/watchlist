import { NextRequest } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_TMDB_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

// Функция для создания массива месяцев для заданного года
function getMonthRanges(year: number) {
  const ranges = [];
  for (let month = 1; month <= 12; month++) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    ranges.push({
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    });
  }
  return ranges;
}

// Функция для получения года из даты
function getYearFromDate(dateString: string): number {
  return new Date(dateString).getFullYear();
}

async function fetchAllPages(baseUrl: string) {
  const firstPage = await fetch(baseUrl + "&page=1");
  const firstPageData = await firstPage.json();
  const totalPages = Math.min(firstPageData.total_pages, 5);

  const otherPages = [];
  for (let page = 2; page <= totalPages; page++) {
    otherPages.push(fetch(baseUrl + `&page=${page}`).then((r) => r.json()));
  }

  const allPagesData = await Promise.all([
    Promise.resolve(firstPageData),
    ...otherPages,
  ]);
  return allPagesData.reduce((acc, data) => {
    if (data && data.results) {
      return [...acc, ...data.results];
    }
    return acc;
  }, []);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("start_date") || "2023-01-01";
  const endDate = searchParams.get("end_date") || "2030-12-31";

  try {
    const startYear = getYearFromDate(startDate);
    const endYear = getYearFromDate(endDate);

    // Получаем диапазоны для всех месяцев запрошенного периода
    const monthRanges = [];
    for (let year = startYear; year <= endYear; year++) {
      monthRanges.push(...getMonthRanges(year));
    }

    // Фильтруем диапазоны по запрошенному периоду
    const filteredRanges = monthRanges.filter(
      (range) => range.start >= startDate && range.end <= endDate
    );

    // Создаем запросы для каждого месяца
    const allUrls = filteredRanges.flatMap(({ start, end }) => [
      // Discover с primary_release_date
      `${API_BASE_URL}/discover/movie?` +
        `api_key=${API_KEY}&` +
        `language=ru-RU&` +
        `primary_release_date.gte=${start}&` +
        `primary_release_date.lte=${end}&` +
        `sort_by=primary_release_date.asc&` +
        `include_adult=false&` +
        `with_original_language=en&` +
        `vote_count.gte=0`,

      // Discover с release_date
      `${API_BASE_URL}/discover/movie?` +
        `api_key=${API_KEY}&` +
        `language=ru-RU&` +
        `release_date.gte=${start}&` +
        `release_date.lte=${end}&` +
        `sort_by=release_date.asc&` +
        `include_adult=false&` +
        `with_original_language=en&` +
        `vote_count.gte=0`,

      // Дополнительный запрос для поиска конкретных фильмов
      `${API_BASE_URL}/discover/movie?` +
        `api_key=${API_KEY}&` +
        `language=ru-RU&` +
        `release_date.gte=${start}&` +
        `release_date.lte=${end}&` +
        `with_original_language=en&` +
        `with_release_type=2|3&` +
        `include_adult=false`,
    ]);

    // Добавляем общие запросы для каждого года
    for (let year = startYear; year <= endYear; year++) {
      allUrls.push(
        // Запрос по году
        `${API_BASE_URL}/discover/movie?` +
          `api_key=${API_KEY}&` +
          `language=ru-RU&` +
          `primary_release_year=${year}&` +
          `with_original_language=en&` +
          `sort_by=release_date.asc&` +
          `include_adult=false`
      );
    }

    // Добавляем upcoming релизы
    allUrls.push(
      `${API_BASE_URL}/movie/upcoming?` +
        `api_key=${API_KEY}&` +
        `language=ru-RU&` +
        `region=US`
    );

    // Получаем данные со всех URL
    const allMoviesArrays = await Promise.all(
      allUrls.map((url) => fetchAllPages(url))
    );

    // Объединяем все результаты
    const allMovies = allMoviesArrays.flat();

    // Нормализуем даты релиза
    const moviesWithDates = allMovies
      .map((movie: any) => {
        const possibleDates = [
          movie.release_date,
          movie.primary_release_date,
        ].filter(Boolean);

        const earliestDate =
          possibleDates.length > 0
            ? possibleDates.reduce((a, b) => (a < b ? a : b))
            : null;

        return {
          ...movie,
          normalized_release_date: earliestDate,
          original_date: movie.release_date,
        };
      })
      .filter((movie) => {
        if (!movie.normalized_release_date) return false;
        const year = new Date(movie.normalized_release_date).getFullYear();
        const hasValidTitle = movie.title || movie.original_title;
        return year >= startYear && year <= endYear && hasValidTitle;
      });

    // Удаляем дубликаты
    const uniqueMovies = Array.from(
      moviesWithDates.reduce((acc, movie) => {
        if (
          !acc.has(movie.id) ||
          movie.normalized_release_date <
            acc.get(movie.id).normalized_release_date
        ) {
          acc.set(movie.id, movie);
        }
        return acc;
      }, new Map())
    ).map(([_, movie]) => movie);

    // Фильтруем по запрошенному диапазону
    const filteredMovies = uniqueMovies.filter((movie: any) => {
      const releaseDate = movie.normalized_release_date;
      return releaseDate >= startDate && releaseDate <= endDate;
    });

    // Сортируем по дате
    const sortedMovies = filteredMovies.sort((a: any, b: any) => {
      return (
        new Date(a.normalized_release_date).getTime() -
        new Date(b.normalized_release_date).getTime()
      );
    });

    const finalMovies = sortedMovies.map((movie) => ({
      ...movie,
      release_date: movie.normalized_release_date,
    }));

    return new Response(
      JSON.stringify({
        results: finalMovies,
        total_results: finalMovies.length,
        total_pages: 1,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in releases API:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch releases",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
      }
    );
  }
}
