const API_KEY = "25d88f055e7a91d25fd272f3fd287165";
const API_BASE_URL = "https://apitmdb.kurwa-bober.ninja/3";
const IMAGE_BASE_URL = "https://imagetmdb.com/t/p";

export interface Movie {
  id: number;
  title: string;
  name?: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string;
  first_air_date?: string;
  media_type?: string;
}

export async function getTrendingMovies() {
  const response = await fetch(
    `${API_BASE_URL}/trending/all/week?api_key=${API_KEY}&language=ru`
  );
  const data = await response.json();
  return data.results;
}

export async function getUpcomingMovies() {
  const response = await fetch(
    `${API_BASE_URL}/movie/upcoming?api_key=${API_KEY}&language=ru`
  );
  const data = await response.json();
  return data.results;
}

export async function getPopularTVShows() {
  const response = await fetch(
    `${API_BASE_URL}/tv/popular?api_key=${API_KEY}&language=ru`
  );
  const data = await response.json();
  return data.results;
}

export function getImageUrl(path: string, size = "w500") {
  if (!path) return "/placeholder.svg?height=300&width=200";
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

export function getYear(date?: string) {
  if (!date) return "";
  return new Date(date).getFullYear().toString();
}

export function formatDate(
  dateString?: string,
  includeYear: boolean = false
): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  const months = [
    "янв.",
    "фев.",
    "мар.",
    "апр.",
    "мая",
    "июн.",
    "июл.",
    "авг.",
    "сен.",
    "окт.",
    "ноя.",
    "дек.",
  ];

  return includeYear
    ? `${day} ${months[month]} ${year}`
    : `${day} ${months[month]}`;
}

export async function getMovieVideos(movieId: string): Promise<any[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=ru-RU,en-US`
    );
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Ошибка при получении видео:", error);
    return [];
  }
}
