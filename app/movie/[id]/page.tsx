import { getMovieDetail, getMovieCredits } from "@/lib/tmdb";
import MovieDetail from "@/components/movie-detail";
import Header from "@/components/header";
import { Suspense } from "react";
import GradientBackground from "@/components/gradient-background";

export default async function MoviePage({
  params,
}: {
  params: { id: string };
}) {
  try {
    const movie = await getMovieDetail(params.id);

    // Если есть флаг ошибки, отображаем страницу с ошибкой
    if (movie.error) {
      return (
        <GradientBackground>
          <div className="min-h-screen text-white">
            <Header />
            <main className="pt-32 pb-8 px-6 flex flex-col items-center justify-center">
              <div className="max-w-lg text-center">
                <h1 className="text-3xl font-bold text-red-400 mb-4">
                  Фильм не найден
                </h1>
                <p className="text-lg text-gray-300 mb-6">
                  Информация о запрошенном фильме недоступна. Возможно, фильм
                  был удален из базы данных или произошла ошибка.
                </p>
                <a
                  href="/"
                  className="inline-block px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors duration-300"
                >
                  Вернуться на главную
                </a>
              </div>
            </main>
          </div>
        </GradientBackground>
      );
    }

    const cast = await getMovieCredits(params.id);

    return (
      <div className="min-h-screen bg-[#121212]">
        <Header />
        <Suspense
          fallback={
            <div className="pt-32 flex justify-center">
              <div className="w-10 h-10 border-4 border-gray-600 border-t-yellow-400 rounded-full animate-spin"></div>
            </div>
          }
        >
          <MovieDetail movie={movie} cast={cast} />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error("Ошибка при загрузке страницы фильма:", error);

    return (
      <GradientBackground>
        <div className="min-h-screen text-white">
          <Header />
          <main className="pt-32 pb-8 px-6 flex flex-col items-center justify-center">
            <div className="max-w-lg text-center">
              <h1 className="text-3xl font-bold text-red-400 mb-4">
                Что-то пошло не так
              </h1>
              <p className="text-lg text-gray-300 mb-6">
                При загрузке информации о фильме произошла ошибка. Пожалуйста,
                попробуйте еще раз позже.
              </p>
              <a
                href="/"
                className="inline-block px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors duration-300"
              >
                Вернуться на главную
              </a>
            </div>
          </main>
        </div>
      </GradientBackground>
    );
  }
}
