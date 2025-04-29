import {
  getActorInfo,
  getMoviesByActor,
  getImageUrl,
  Movie,
  getActorImages,
  getActorAsProducer,
  getActorExternalIds,
  getTVByActor,
} from "@/lib/tmdb";
import { ACTORS } from "@/lib/actors";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/header";
import GradientBackground from "@/components/gradient-background";
import MovieRow from "@/components/movie-row";
import ImageSlider from "./image-slider";
import { Suspense } from "react";

// Импортируем клиентскую обертку из отдельного файла
import ActorPageWrapper from "./page-client";

export const dynamicParams = "force-static";
export const revalidate = 3600; // Обновлять кеш раз в час

// Компонент для отображения контента страницы актера
async function ActorPageContent({ params }: { params: { id: string } }) {
  const actorId = parseInt(params.id);

  if (isNaN(actorId)) {
    notFound();
  }

  // Получаем данные об актере, его фильмах и изображения
  const [actorInfo, movies, actorImages, producerMovies, externalIds, tvShows] =
    await Promise.all([
      getActorInfo(actorId),
      getMoviesByActor(actorId),
      getActorImages(actorId),
      getActorAsProducer(actorId),
      getActorExternalIds(actorId),
      getTVByActor(actorId),
    ]);

  // Если не удалось получить информацию об актере, возвращаем 404
  if (!actorInfo) {
    notFound();
  }

  // Проверяем, существует ли актер в предопределенном массиве ACTORS
  // Если нет, используем информацию из API
  const predefinedActor = ACTORS.find((a) => a.id === actorId);
  const actorName = actorInfo.name;
  const actorTitle = predefinedActor?.title || actorInfo.name;

  // Получаем URL изображения актера
  const imageUrl = actorInfo.profile_path
    ? getImageUrl(actorInfo.profile_path, "w342")
    : null;

  // Проверяем наличие социальных сетей
  const hasSocialMedia =
    externalIds &&
    (externalIds.instagram_id ||
      externalIds.twitter_id ||
      externalIds.facebook_id);

  // Группируем фильмы по жанрам для разных слайдеров
  const groupMoviesByGenre = (movies: Movie[]) => {
    const genres: Record<string, Movie[]> = {};

    // Популярные жанры для группировки фильмов
    const genreMap: Record<number, string> = {
      28: "Боевики",
      12: "Приключения",
      16: "Мультфильмы",
      35: "Комедии",
      80: "Криминальные фильмы",
      18: "Драмы",
      10751: "Семейные",
      14: "Фэнтези",
      36: "Исторические",
      27: "Ужасы",
      10749: "Мелодрамы",
      9648: "Детективы",
      878: "Научная фантастика",
      53: "Триллеры",
      10752: "Военные",
      37: "Вестерны",
    };

    // Категоризируем фильмы по жанрам
    movies.forEach((movie) => {
      if (movie.genres && movie.genres.length > 0) {
        movie.genres.forEach((genre) => {
          const genreName = genreMap[genre.id] || genre.name;
          if (!genres[genreName]) {
            genres[genreName] = [];
          }

          // Добавляем фильм в соответствующий жанр, если он еще не добавлен
          if (!genres[genreName].some((m) => m.id === movie.id)) {
            genres[genreName].push(movie);
          }
        });
      } else {
        // Если у фильма нет жанра, добавляем его в "Прочие фильмы"
        if (!genres["Прочие фильмы"]) {
          genres["Прочие фильмы"] = [];
        }
        genres["Прочие фильмы"].push(movie);
      }
    });

    return genres;
  };

  // Делим фильмы по десятилетиям
  const groupMoviesByDecade = (movies: Movie[]) => {
    const decades: Record<string, Movie[]> = {};

    movies.forEach((movie) => {
      if (movie.release_date) {
        const year = parseInt(movie.release_date.split("-")[0]);
        const decade = Math.floor(year / 10) * 10;
        const decadeName = `${decade}-е годы`;

        if (!decades[decadeName]) {
          decades[decadeName] = [];
        }

        decades[decadeName].push(movie);
      }
    });

    // Сортируем десятилетия в обратном порядке (новые в начале)
    const sortedDecades = Object.fromEntries(
      Object.entries(decades).sort((a, b) => {
        const decadeA = parseInt(a[0]);
        const decadeB = parseInt(b[0]);
        return decadeB - decadeA;
      })
    );

    // Сортируем фильмы внутри каждого десятилетия от новых к старым
    Object.keys(sortedDecades).forEach((decade) => {
      sortedDecades[decade].sort((a, b) => {
        const yearA = a.release_date
          ? parseInt(a.release_date.split("-")[0])
          : 0;
        const yearB = b.release_date
          ? parseInt(b.release_date.split("-")[0])
          : 0;

        if (yearA === yearB) {
          // Если годы одинаковые, сортируем по месяцу и дню
          const dateA = a.release_date || "";
          const dateB = b.release_date || "";
          return dateB.localeCompare(dateA);
        }

        return yearB - yearA;
      });
    });

    return sortedDecades;
  };

  // Определяем фильмы с озвучкой
  const voiceActingMovies = movies.filter((movie) => {
    const character = movie.character?.toLowerCase() || "";
    return (
      character.includes("голос") ||
      character.includes("озвуч") ||
      character.includes("voice") ||
      character.includes("рассказчик") ||
      character.includes("narrator")
    );
  });

  // Получаем ID фильмов с озвучкой для фильтрации
  const voiceActingIds = new Set(voiceActingMovies.map((movie) => movie.id));

  // Фильмы без озвучки для использования в других слайдерах
  const moviesWithoutVoiceActing = movies.filter(
    (movie) => !voiceActingIds.has(movie.id)
  );

  // Получаем лучшие фильмы по рейтингу с учетом количества оценок, исключая озвучку
  const topRatedMovies = [...moviesWithoutVoiceActing]
    .filter((movie) => (movie.vote_count || 0) > 10)
    .sort((a, b) => {
      // Комбинированная метрика: рейтинг * log(количество оценок)
      const scoreA = (a.vote_average || 0) * Math.log10(a.vote_count || 1 + 1);
      const scoreB = (b.vote_average || 0) * Math.log10(b.vote_count || 1 + 1);
      return scoreB - scoreA;
    })
    .slice(0, 20);

  // Получаем самые популярные фильмы
  const mostPopularMovies = [...movies]
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 15);

  // Получаем группировки фильмов БЕЗ озвучки
  const moviesByGenre = groupMoviesByGenre(moviesWithoutVoiceActing);
  const moviesByDecade = groupMoviesByDecade(moviesWithoutVoiceActing);

  // Создаем слайдеры для отображения
  const genreSliders = Object.entries(moviesByGenre)
    .filter(([_, movies]) => movies.length >= 3) // Показываем только жанры с 3+ фильмами
    .sort((a, b) => b[1].length - a[1].length); // Сортируем по количеству фильмов

  const decadeSliders = Object.entries(moviesByDecade).filter(
    ([_, movies]) => movies.length >= 3
  );

  return (
    <main className="pt-24 pb-12">
      <div className="container-fluid mx-auto">
        <div className="flex flex-col md:flex-row gap-0 mb-12 px-4 sm:px-6">
          {/* Аватар актера */}
          <div className="w-full md:w-1/5 lg:w-1/6 flex justify-center md:justify-start">
            <div className="relative w-48 h-48 md:w-52 md:h-52 lg:w-56 lg:h-56 aspect-square rounded-full overflow-hidden border-2 border-white/30 shadow-lg shadow-white/10">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={actorInfo.name}
                  width={224}
                  height={224}
                  className="object-cover w-full h-full rounded-full"
                  priority
                  style={{ borderRadius: "50%" }}
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Информация об актере */}
          <div className="flex-1 md:-ml-4">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-bebas-neue tracking-wider uppercase">
              {actorTitle}
            </h1>

            {/* Информация о рождении и возрасте актера */}
            {(actorInfo.birthday || actorInfo.place_of_birth) && (
              <p className="text-gray-400 mb-3 text-sm">
                {actorInfo.birthday && (
                  <>
                    Родился{" "}
                    {new Date(actorInfo.birthday).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {!actorInfo.deathday && (
                      <>
                        {" "}
                        (
                        {Math.floor(
                          (new Date().getTime() -
                            new Date(actorInfo.birthday).getTime()) /
                            (365.25 * 24 * 60 * 60 * 1000)
                        )}{" "}
                        лет)
                      </>
                    )}
                    {actorInfo.place_of_birth && (
                      <>, {actorInfo.place_of_birth}</>
                    )}
                    {actorInfo.deathday && (
                      <>
                        <br />
                        Умер{" "}
                        {new Date(actorInfo.deathday).toLocaleDateString(
                          "ru-RU",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )}{" "}
                        (
                        {Math.floor(
                          (new Date(actorInfo.deathday).getTime() -
                            new Date(actorInfo.birthday).getTime()) /
                            (365.25 * 24 * 60 * 60 * 1000)
                        )}{" "}
                        лет)
                      </>
                    )}
                  </>
                )}
                {!actorInfo.birthday && actorInfo.place_of_birth && (
                  <>Родился в {actorInfo.place_of_birth}</>
                )}
              </p>
            )}

            {/* Кнопка подписки на актера - будет заменена на клиентскую версию */}
            <div className="mb-4 flex justify-start">
              {/* Заглушка для кнопки подписки - заменится на клиенте */}
              <div
                id="subscribe-button-container"
                className="h-10 w-36 rounded-full bg-gray-800/60"
              ></div>

              {/* Информация о социальных сетях актера */}
              {hasSocialMedia && (
                <div className="social-media-container flex items-center ml-4 gap-3">
                  {externalIds?.instagram_id && (
                    <a
                      href={`https://instagram.com/${externalIds.instagram_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="flex items-center justify-center w-12 h-12 rounded-full bg-transparent hover:bg-white transition-all duration-250 hover:shadow-md"
                    >
                      <svg
                        aria-hidden="true"
                        className="w-6 h-6 text-gray-400/60 hover:text-black transition-colors duration-250"
                        fill="currentColor"
                        viewBox="0 0 48 48"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M32.5389 24.0094C32.5389 19.2927 28.7156 15.4695 24 15.4695C19.2839 15.4695 15.4612 19.2927 15.4612 24.0094C15.4612 28.7256 19.2839 32.5494 24 32.5494C28.7156 32.5494 32.5389 28.7256 32.5389 24.0094Z"
                          fill="currentColor"
                        ></path>
                        <path
                          clipRule="evenodd"
                          d="M23.1465 3.00615C22.6285 3.00592 22.1485 3.00571 21.7022 3.0064V3C16.928 3.00534 16.0122 3.03736 13.649 3.14411C11.1514 3.25887 9.79533 3.67519 8.89235 4.02746C7.69691 4.49289 6.84302 5.04799 5.94644 5.94468C5.04986 6.84138 4.49377 7.69537 4.02947 8.89096C3.67884 9.79406 3.2615 11.1498 3.1473 13.6477C3.02455 16.3485 3 17.1555 3 23.9971C3 30.8386 3.02455 31.6499 3.1473 34.3507C3.26097 36.8486 3.67884 38.2043 4.02947 39.1064C4.49483 40.3025 5.04986 41.1544 5.94644 42.051C6.84302 42.9477 7.69691 43.5028 8.89235 43.9672C9.79587 44.3179 11.1514 44.7353 13.649 44.8506C16.3494 44.9733 17.1601 45 24.0003 45C30.8399 45 31.6511 44.9733 34.3515 44.8506C36.8491 44.7363 38.2057 44.32 39.1077 43.9677C40.3036 43.5034 41.1548 42.9483 42.0514 42.0516C42.948 41.1554 43.5041 40.3041 43.9684 39.1085C44.319 38.2065 44.7364 36.8508 44.8506 34.3528C44.9733 31.6521 45 30.8408 45 24.0035C45 17.1662 44.9733 16.3549 44.8506 13.6541C44.7369 11.1562 44.319 9.80047 43.9684 8.89844C43.503 7.70284 42.948 6.84885 42.0514 5.95215C41.1554 5.05546 40.3031 4.50036 39.1077 4.036C38.2047 3.68533 36.8491 3.26794 34.3515 3.15372C31.6506 3.03096 30.8399 3.0064 24.0003 3.0064L23.1465 3.00615ZM34.5996 10.3328C34.5996 8.63522 35.9765 7.25993 37.6736 7.25993V7.25886C39.3707 7.25886 40.7476 8.63575 40.7476 10.3328C40.7476 12.0299 39.3707 13.4068 37.6736 13.4068C35.9765 13.4068 34.5996 12.0299 34.5996 10.3328ZM23.9997 10.8517C16.7347 10.8517 10.8445 16.7426 10.8445 24.0085C10.8445 31.2744 16.7347 37.1627 23.9997 37.1627C31.2647 37.1627 37.1528 31.2744 37.1528 24.0085C37.1528 16.7426 31.2647 10.8517 23.9997 10.8517Z"
                          fill="currentColor"
                          fillRule="evenodd"
                        ></path>
                      </svg>
                    </a>
                  )}

                  {externalIds?.twitter_id && (
                    <a
                      href={`https://twitter.com/${externalIds.twitter_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Twitter"
                      className="flex items-center justify-center w-12 h-12 rounded-full bg-transparent hover:bg-white transition-all duration-250 hover:shadow-md"
                    >
                      <svg
                        aria-hidden="true"
                        className="w-6 h-6 text-gray-400/60 hover:text-black transition-colors duration-250"
                        fill="currentColor"
                        viewBox="0 0 48 48"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M27.9957 20.7841L43.6311 3H39.9261L26.3498 18.4417L15.5065 3H3L19.3972 26.3506L3 45H6.70531L21.0422 28.693L32.4935 45H45L27.9948 20.7841H27.9957ZM22.9208 26.5563L21.2594 24.2311L8.04039 5.72933H13.7315L24.3994 20.6609L26.0608 22.9861L39.9278 42.3948H34.2367L22.9208 26.5572V26.5563Z"
                          fill="currentColor"
                        ></path>
                      </svg>
                    </a>
                  )}

                  {externalIds?.facebook_id && (
                    <a
                      href={`https://facebook.com/${externalIds.facebook_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                      className="flex items-center justify-center w-12 h-12 rounded-full bg-transparent hover:bg-white transition-all duration-250 hover:shadow-md"
                    >
                      <svg
                        aria-hidden="true"
                        className="w-6 h-6 text-gray-400/60 hover:text-black transition-colors duration-250"
                        fill="currentColor"
                        viewBox="0 0 48 48"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7 3C4.79086 3 3 4.79086 3 7V41C3 43.2091 4.79086 45 7 45H18.9876V28.4985H15V21.7779H18.9876V17.7429C18.9876 12.2602 21.2393 9 27.6365 9H32.9623V15.7214H29.6333C27.143 15.7214 26.9783 16.6606 26.9783 18.4134L26.9692 21.7771H33L32.2943 28.4977H26.9692V45H41C43.2091 45 45 43.2091 45 41V7C45 4.79086 43.2091 3 41 3H7Z"
                          fill="currentColor"
                        ></path>
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>

            {actorInfo.biography && (
              <div className="mt-12 md:max-w-[50%]">
                <div className="biography-container">
                  <p className="text-gray-300 text-sm leading-relaxed biography-text">
                    {actorInfo.biography}
                  </p>
                  {actorInfo.biography.length > 500 && (
                    <button className="read-more-button text-yellow-400 text-sm mt-2 hover:text-yellow-300 focus:outline-none transition-colors duration-200 flex items-center">
                      <span className="button-text">Подробнее</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="arrow-icon ml-1 transition-transform duration-300"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Слайдеры с фильмами */}
        <div className="space-y-12 mt-12">
          {/* Известные работы - показываем самые популярные фильмы */}
          {mostPopularMovies.length >= 5 && (
            <MovieRow
              title={`ИЗВЕСТНЫЕ РАБОТЫ ${actorName.toUpperCase()}`}
              items={mostPopularMovies}
              variant="backdrop"
              posterSize="large"
              showDate
              showYear
              showLogo
            />
          )}

          {/* Лучшие фильмы по рейтингу */}
          {topRatedMovies.length >= 5 && (
            <MovieRow
              title={`Лучшее с участием ${
                actorInfo.gender === 1 ? "актрисы" : "актера"
              } по рейтингу`}
              items={topRatedMovies}
              variant="poster"
              posterSize="large"
              className="mb-8"
            />
          )}

          {/* Все фильмы - показываем в виде слайдера с пометками о статусе */}
          <MovieRow
            title={`ВСЕ ФИЛЬМЫ С ${actorName.toUpperCase()} (${movies.length})`}
            items={movies
              .slice(0, 200)
              .sort((a, b) => {
                const yearA = a.release_date
                  ? parseInt(a.release_date.split("-")[0])
                  : 0;
                const yearB = b.release_date
                  ? parseInt(b.release_date.split("-")[0])
                  : 0;

                if (yearA === yearB) {
                  // Если годы одинаковые, сортируем по месяцу и дню
                  const dateA = a.release_date || "";
                  const dateB = b.release_date || "";
                  return dateB.localeCompare(dateA);
                }

                return yearB - yearA;
              })
              .map((movie) => ({
                ...movie,
                // Добавляем префикс к названию для фильмов без даты выхода (в разработке)
                title:
                  !movie.release_date &&
                  (movie.status === "Post Production" || !movie.poster_path)
                    ? `[В разработке] ${movie.title}`
                    : movie.title,
              }))}
            variant="poster"
            posterSize="large"
            showYear
          />

          {/* Сериалы с участием актера */}
          {tvShows.length > 0 && (
            <MovieRow
              title={`${actorName} в телесериалах`}
              items={tvShows}
              variant="poster"
              posterSize="large"
              className="mb-8"
            />
          )}

          {/* Фильмы по жанрам */}
          {genreSliders.map(([genreName, movies]) => (
            <MovieRow
              key={genreName}
              title={`${genreName} с участием ${actorName}`}
              items={movies}
              variant="poster"
              posterSize="large"
              className="mb-8"
            />
          ))}

          {/* Фильмы по десятилетиям - здесь уже есть сортировка по годам внутри группы */}
          {decadeSliders.map(([decade, movies]) => (
            <MovieRow
              key={decade}
              title={`${actorName} в ${decade}`}
              items={movies}
              variant="poster"
              posterSize="large"
              className="mb-8"
            />
          ))}

          {/* Фильмы с озвучкой */}
          {voiceActingMovies.length > 0 && (
            <MovieRow
              title={`${actorName} - Озвучка`}
              items={voiceActingMovies}
              variant="poster"
              posterSize="large"
              className="mb-8"
            />
          )}

          {/* Фильмы, где актер был продюсером */}
          {producerMovies.length > 0 && (
            <MovieRow
              title={`${actorName} как продюсер`}
              items={producerMovies}
              variant="poster"
              posterSize="large"
              className="mb-8"
            />
          )}

          {/* Галерея изображений актера */}
          {actorImages && actorImages.length > 0 && (
            <ImageSlider
              title="ФОТОГАЛЕРЕЯ"
              images={actorImages}
              actorName={actorName}
            />
          )}
        </div>
      </div>
    </main>
  );
}

// Основной компонент страницы - только серверная логика
export default function ActorPage({ params }: { params: { id: string } }) {
  return (
    <GradientBackground>
      {/* Хедер всегда видимый */}
      <Header />

      {/* Контент с лоадером */}
      <Suspense
        fallback={
          <div className="min-h-screen pt-24 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
          </div>
        }
      >
        <ActorPageWrapper params={params}>
          <ActorPageContent params={params} />
        </ActorPageWrapper>
      </Suspense>
    </GradientBackground>
  );
}
