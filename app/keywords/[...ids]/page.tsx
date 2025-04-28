import { Suspense } from "react";
import { notFound } from "next/navigation";
import Header from "@/components/header";
import GradientBackground from "@/components/gradient-background";
import { fetchKeywordMovies, getKeywordInfo } from "@/lib/keywords";
import MovieGrid from "@/components/movie-grid";
import LoadMoreButton from "@/components/load-more-button";
import InfiniteMovieGrid from "@/components/infinite-movie-grid";

// Функция для получения параметров из URL
export function generateMetadata({ params }: { params: { ids: string[] } }) {
  return {
    title: "Коллекция фильмов",
  };
}

export default async function KeywordDetailsPage({
  params,
  searchParams,
}: {
  params: { ids: string[] };
  searchParams: { description?: string };
}) {
  // Проверяем наличие параметров
  if (!params.ids || params.ids.length === 0) {
    return notFound();
  }

  const keywordIds = params.ids.map((id) => parseInt(id, 10));
  const descriptionFromParams = searchParams.description || "";

  try {
    // Получаем информацию о ключевых словах
    const keywordInfos = await Promise.all(
      keywordIds.map((id) => getKeywordInfo(id))
    );
    const keywordNames = keywordInfos.map((info) => info.name).join(", ");

    // Получаем первую страницу фильмов с минимальным кол-вом голосов 200 вместо 500
    const moviesData = await fetchKeywordMovies(keywordIds, 1, 200);
    const initialMovies = moviesData.results;
    const totalPages = moviesData.total_pages;

    return (
      <GradientBackground>
        <div className="min-h-screen text-white">
          <Header />
          <main className="pt-32 pb-8">
            <div className="px-6 mb-8">
              <h1 className="text-3xl font-bold uppercase tracking-wide font-bebas-neue pb-2 pr-2 relative border-b-0">
                <span className="text-white">{keywordNames}</span>
                <div className="absolute left-0 right-[60%] bottom-0 h-px bg-gradient-to-r from-yellow-500/40 via-yellow-500/40 to-transparent"></div>
              </h1>
              {descriptionFromParams && (
                <div className="mt-2 relative pl-3">
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-yellow-500/40 to-transparent"></div>
                  <p className="italic text-yellow-50/80 text-base font-light tracking-wide">
                    {descriptionFromParams}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6">
              {/* Используем стандартный MovieGrid с border и hover эффектами */}
              <InfiniteMovieGrid
                initialMovies={initialMovies}
                keywordIds={keywordIds}
                initialPage={1}
                totalPages={totalPages}
                useDiscoverStyle={true}
                posterSize="medium"
              />
            </div>
          </main>
        </div>
      </GradientBackground>
    );
  } catch (error) {
    console.error("Ошибка при загрузке коллекции:", error);
    return (
      <GradientBackground>
        <div className="min-h-screen text-white">
          <Header />
          <main className="pt-32 pb-8">
            <div className="px-6 py-10 text-center">
              <p className="text-red-400">
                Произошла ошибка при загрузке фильмов. Пожалуйста, попробуйте
                позже.
              </p>
            </div>
          </main>
        </div>
      </GradientBackground>
    );
  }
}
