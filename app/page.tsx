// Убираем "use client"; из async компонента
// "use client";

import { Suspense } from "react";
import GradientBackground from "@/components/gradient-background";
import Header from "@/components/header";
import MovieRow from "@/components/movie-row";
import {
  getTrendingMovies,
  getNowPlayingMovies,
  getLatestTrailers,
  getMoviesByGenre,
  getBestMoviesOf2025,
  getBestMoviesOf2024,
  getRussianMovies,
  getPopularMoviesOnly,
  type Movie as LocalMovieType,
} from "@/lib/tmdb";
import { getAllActorsInfo, getAllActorsMovies } from "@/lib/actors";
import dynamic from "next/dynamic";
import { ensurePlainMovieObject } from "@/lib/movie-utils";
import HeroBackdropSlider from "@/components/hero-backdrop-slider";

// Динамический импорт компонента GenreStrip
const GenreStrip = dynamic(() => import("@/components/genre-strip"), {
  ssr: true,
});

// Динамический импорт с отключенным SSR
const ViewingHistoryRow = dynamic(
  () => import("@/components/viewing-history-row"),
  { ssr: false }
);

async function HomePageContent() {
  try {
    // Получаем данные об актерах из нового файла
    const actorsWithInfo = await getAllActorsInfo();
    const actorsMovies = await getAllActorsMovies();

    const [
      trending,
      nowPlaying,
      latestTrailers,
      movies2025,
      movies2024,
      russianMovies,
      comedyMovies,
      horrorMovies,
      actionMovies,
      mysteryMovies,
      scienceFictionMovies,
      warMovies,
      adventureMovies,
      crimeMovies,
      fantasyMovies,
      romanceMovies,
      historyMovies,
      animationMovies,
      dramaMovies,
      familyMovies,
      westernMovies,
      popularMoviesData,
    ] = await Promise.all([
      getTrendingMovies(),
      getNowPlayingMovies(),
      getLatestTrailers(),
      getBestMoviesOf2025(),
      getBestMoviesOf2024(),
      getRussianMovies().then((data) => data.map(ensurePlainMovieObject)),
      getMoviesByGenre(35).then((data) => data.map(ensurePlainMovieObject)),
      getMoviesByGenre(27).then((data) => data.map(ensurePlainMovieObject)),
      getMoviesByGenre(28).then((data) => data.map(ensurePlainMovieObject)),
      getMoviesByGenre(9648).then((data) => data.map(ensurePlainMovieObject)),
      getMoviesByGenre(878).then((data) => data.map(ensurePlainMovieObject)),
      getMoviesByGenre(10752).then((data) => data.map(ensurePlainMovieObject)),
      getMoviesByGenre(12).then((data) => data.map(ensurePlainMovieObject)),
      getMoviesByGenre(80).then((data) => data.map(ensurePlainMovieObject)),
      getMoviesByGenre(14).then((data) => data.map(ensurePlainMovieObject)),
      getMoviesByGenre(10749).then((data) => data.map(ensurePlainMovieObject)),
      getMoviesByGenre(36).then((data) => data.map(ensurePlainMovieObject)),
      getMoviesByGenre(16).then((data) => data.map(ensurePlainMovieObject)),
      getMoviesByGenre(18).then((data) => data.map(ensurePlainMovieObject)),
      getMoviesByGenre(10751).then((data) => data.map(ensurePlainMovieObject)),
      getMoviesByGenre(37).then((data) => data.map(ensurePlainMovieObject)),
      getPopularMoviesOnly(),
    ]);

    const popularMovies: LocalMovieType[] = popularMoviesData.items.map(
      ensurePlainMovieObject
    );

    console.log(
      "Получено популярных фильмов (без фильтрации):",
      popularMovies.length
    ); // Добавим лог для проверки

    // Подготовка данных для GenreStrip
    const genresForStrip = [
      {
        id: 16,
        name: "Мультфильмы",
        movies: animationMovies.slice(0, 3).map((m) => ({
          id: m.id,
          poster_path: m.poster_path,
          title: m.title,
          name: m.name,
        })),
      },
      {
        id: 35,
        name: "Комедии",
        movies: comedyMovies.slice(0, 3).map((m) => ({
          id: m.id,
          poster_path: m.poster_path,
          title: m.title,
          name: m.name,
        })),
      },
      {
        id: 27,
        name: "Ужасы",
        movies: horrorMovies.slice(0, 3).map((m) => ({
          id: m.id,
          poster_path: m.poster_path,
          title: m.title,
          name: m.name,
        })),
      },
      {
        id: 28,
        name: "Боевики",
        movies: actionMovies.slice(0, 3).map((m) => ({
          id: m.id,
          poster_path: m.poster_path,
          title: m.title,
          name: m.name,
        })),
      },
      {
        id: 878,
        name: "Фантастика",
        movies: scienceFictionMovies.slice(0, 3).map((m) => ({
          id: m.id,
          poster_path: m.poster_path,
          title: m.title,
          name: m.name,
        })),
      },
      {
        id: 12,
        name: "Приключения",
        movies: adventureMovies.slice(0, 3).map((m) => ({
          id: m.id,
          poster_path: m.poster_path,
          title: m.title,
          name: m.name,
        })),
      },
      {
        id: 14,
        name: "Фэнтези",
        movies: fantasyMovies.slice(0, 3).map((m) => ({
          id: m.id,
          poster_path: m.poster_path,
          title: m.title,
          name: m.name,
        })),
      },
      {
        id: 10749,
        name: "Мелодрамы",
        movies: romanceMovies.slice(0, 3).map((m) => ({
          id: m.id,
          poster_path: m.poster_path,
          title: m.title,
          name: m.name,
        })),
      },
      {
        id: 18,
        name: "Драмы",
        movies: dramaMovies.slice(0, 3).map((m) => ({
          id: m.id,
          poster_path: m.poster_path,
          title: m.title,
          name: m.name,
        })),
      },
      {
        id: 10751,
        name: "Семейные",
        movies: familyMovies.slice(0, 3).map((m) => ({
          id: m.id,
          poster_path: m.poster_path,
          title: m.title,
          name: m.name,
        })),
      },
      {
        id: 9648,
        name: "Детективы",
        movies: mysteryMovies.slice(0, 3).map((m) => ({
          id: m.id,
          poster_path: m.poster_path,
          title: m.title,
          name: m.name,
        })),
      },
      {
        id: 10752,
        name: "Военные фильмы",
        movies: warMovies.slice(0, 3).map((m) => ({
          id: m.id,
          poster_path: m.poster_path,
          title: m.title,
          name: m.name,
        })),
      },
      {
        id: 80,
        name: "Криминальные фильмы",
        movies: crimeMovies.slice(0, 3).map((m) => ({
          id: m.id,
          poster_path: m.poster_path,
          title: m.title,
          name: m.name,
        })),
      },
      {
        id: 36,
        name: "Исторические фильмы",
        movies: historyMovies.slice(0, 3).map((m) => ({
          id: m.id,
          poster_path: m.poster_path,
          title: m.title,
          name: m.name,
        })),
      },
      {
        id: 37,
        name: "Вестерны",
        movies: westernMovies.slice(0, 3).map((m) => ({
          id: m.id,
          poster_path: m.poster_path,
          title: m.title,
          name: m.name,
        })),
      },
    ].filter((genre) => genre.movies.length > 0);

    // Обновляем genreSliders с преобразованными items
    const genreSliders = [
      {
        id: -1,
        title: "ПОПУЛЯРНЫЕ ФИЛЬМЫ ИЗ РОССИИ",
        items: russianMovies.slice(0, 20),
      },
      {
        id: 35,
        title: "ЛУЧШИЕ КОМЕДИИ",
        items: comedyMovies.slice(0, 20),
      },
      {
        id: 27,
        title: "УЖАСЫ",
        items: horrorMovies.slice(0, 20),
      },
      {
        id: 28,
        title: "БОЕВИКИ",
        items: actionMovies.slice(0, 20),
      },
      {
        id: 9648,
        title: "ДЕТЕКТИВЫ",
        items: mysteryMovies.slice(0, 20),
      },
      {
        id: 878,
        title: "ФАНТАСТИКА",
        items: scienceFictionMovies.slice(0, 20),
      },
      {
        id: 10752,
        title: "ВОЕННЫЕ ФИЛЬМЫ",
        items: warMovies.slice(0, 20),
      },
      {
        id: 12,
        title: "ПРИКЛЮЧЕНИЯ",
        items: adventureMovies.slice(0, 20),
      },
      {
        id: 80,
        title: "КРИМИНАЛЬНЫЕ ФИЛЬМЫ",
        items: crimeMovies.slice(0, 20),
      },
      {
        id: 14,
        title: "ФЭНТЕЗИ",
        items: fantasyMovies.slice(0, 20),
      },
      {
        id: 10749,
        title: "МЕЛОДРАМЫ",
        items: romanceMovies.slice(0, 20),
      },
      {
        id: 36,
        title: "ИСТОРИЧЕСКИЕ ФИЛЬМЫ",
        items: historyMovies.slice(0, 20),
      },
      {
        id: 16,
        title: "МУЛЬТФИЛЬМЫ",
        items: animationMovies.slice(0, 20),
      },
      {
        id: 18,
        title: "ДРАМЫ",
        items: dramaMovies.slice(0, 20),
      },
      {
        id: 10751,
        title: "СЕМЕЙНЫЕ ФИЛЬМЫ",
        items: familyMovies.slice(0, 20),
      },
      {
        id: 37,
        title: "ВЕСТЕРНЫ",
        items: westernMovies.slice(0, 20),
      },
    ];

    // Функция для перемешивания массива (Fisher-Yates shuffle)
    function shuffleArray<T>(array: T[]): T[] {
      const newArray = [...array];
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
      return newArray;
    }

    // Перемешиваем жанровые слайдеры
    const shuffledGenreSliders = shuffleArray(genreSliders);

    // Перемешиваем актерские слайдеры
    const shuffledActors = shuffleArray([...actorsWithInfo]);

    // Создаем комбинированные слайдеры с типом для различения
    type ActorSlider = {
      type: "actor";
      actor: (typeof actorsWithInfo)[0];
      title: string;
      items: LocalMovieType[];
    };

    type GenreSlider = {
      type: "genre";
      genreId: number;
      title: string;
      items: LocalMovieType[];
    };

    type CombinedSlider = ActorSlider | GenreSlider;

    // Обновляем actorSliders с преобразованными items
    const actorSliders: ActorSlider[] = shuffledActors.map((actor) => ({
      type: "actor",
      actor,
      title: actor.title,
      items: actorsMovies[actor.id].slice(0, 100).map(ensurePlainMovieObject),
    }));

    // Обновляем genreSliders2, беря items из shuffledGenreSliders
    const genreSliders2: GenreSlider[] = shuffledGenreSliders.map((slider) => ({
      type: "genre",
      genreId: slider.id,
      title: slider.title,
      items: slider.items,
    }));

    // Объединяем и перемешиваем все слайдеры
    const allSliders: CombinedSlider[] = shuffleArray([
      ...actorSliders,
      ...genreSliders2,
    ]);

    // Сортируем фильмы по показателю популярности в убывающем порядке
    return (
      <div className="min-h-screen text-white">
        {/* Header больше не рендерится здесь */}
        {/* <Header /> */}
        <main className="pb-8">
          {/* Слайдер популярных фильмов во всю ширину - ИЗМЕНЯЕМ ИСТОЧНИК ДАННЫХ */}
          {popularMovies && popularMovies.length > 0 && (
            <HeroBackdropSlider items={popularMovies.slice(0, 20)} /> // Используем nowPlaying вместо popularMovies
          )}
          {/* Контейнер для основного контента страницы с отступом сверху под фиксированный HeroBackdropSlider */}
          <div className="relative z-20 container-fluid mx-auto space-y-4 pt-[60vh] md:pt-[75vh]">
            {" "}
            {/* Добавлены relative и z-20 */}
            {/* Фиксированные первые 3 слайдера */}
            <MovieRow
              title="В тренде за неделю"
              items={trending.slice(0, 20)}
              variant="poster"
              posterSize="xlarge"
              showDate
              showYear
              titleFontClass="font-exo-2"
              disableGlowEffect={true}
            />
            <MovieRow
              title="ПОСЛЕДНИЕ ДОБАВЛЕННЫЕ ТРЕЙЛЕРЫ"
              items={latestTrailers.slice(0, 20)}
              variant="backdrop"
              backdropSize="xlarge"
              showDate
              showYear
              showLogo
              isTrailerSection
              titleFontClass="font-exo-2"
              disableGlowEffect={true}
            />
            <MovieRow
              title="ПОПУЛЯРНОЕ НА WATCHLIST"
              items={popularMovies.slice(0, 20)} // Передаем результат без фильтрации
              variant="poster"
              posterSize="xlarge"
              showDate
              showYear
              viewAllLink="/popular" // <--- Добавляем ссылку "Показать все"
              titleFontClass="font-exo-2"
              disableGlowEffect={true}
            />
            <MovieRow
              title="СЕЙЧАС СМОТРЯТ"
              items={nowPlaying.slice(0, 20)}
              variant="poster"
              posterSize="xlarge"
              showDate
              showYear
              titleFontClass="font-exo-2"
              disableGlowEffect={true}
            />
            {/* Полоса жанров */}
            <GenreStrip genresWithMovies={genresForStrip} />
            <MovieRow
              title="ЛУЧШИЕ ФИЛЬМЫ 2025 ГОДА ПО ОЦЕНКАМ"
              items={movies2025.slice(0, 20)}
              variant="backdrop"
              backdropSize="xlarge"
              showDate
              showYear
              showLogo
              titleFontClass="font-exo-2"
              disableGlowEffect={true}
            />
            <MovieRow
              title="ЛУЧШИЕ ФИЛЬМЫ 2024 ГОДА ПО ОЦЕНКАМ"
              items={movies2024.slice(0, 20)}
              variant="backdrop"
              backdropSize="xlarge"
              showDate
              showYear
              showLogo
              titleFontClass="font-exo-2"
              disableGlowEffect={true}
            />
            {/* История просмотров */}
            <div className="mt-8">
              <ViewingHistoryRow />
            </div>
            {/* Объединенные и перемешанные слайдеры актеров и жанров */}
            {allSliders.map((slider, index) =>
              slider.type === "actor" ? (
                // Актерские ряды
                <MovieRow
                  key={`actor-${slider.actor.id}`}
                  title={slider.title}
                  items={slider.items}
                  variant="poster"
                  posterSize="xlarge"
                  actorImage={slider.actor.imageUrl}
                  showDate
                  showYear
                  viewAllLink={`/actors/${slider.actor.id}`}
                  titleFontClass="font-exo-2"
                  disableGlowEffect={true}
                />
              ) : (
                // Жанровые ряды
                <MovieRow
                  key={`genre-${index}`}
                  title={slider.title}
                  items={slider.items}
                  variant="poster"
                  posterSize="xlarge"
                  showDate
                  showYear
                  keywordIds={
                    slider.genreId !== -1 ? [slider.genreId] : undefined
                  }
                  titleFontClass="font-exo-2"
                  disableGlowEffect={true}
                />
              )
            )}
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error("Ошибка загрузки контента главной страницы:", error);
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white p-10 bg-gray-900/50 rounded-lg">
          Произошла ошибка при загрузке данных.
        </div>
      </div>
    );
  }
}

// Основной экспорт страницы остается, но вызывает серверный компонент
export default function Home() {
  return (
    <GradientBackground>
      {/* Оборачиваем HomePageContent в Suspense */}
      <Suspense
        fallback={
          // Фолбэк для Suspense, пока грузятся серверные данные HomePageContent
          // Можно использовать тот же спиннер, что и в layout
          <div className="fixed inset-0 flex items-center justify-center bg-[#121212] z-[55]">
            {" "}
            {/* Немного выше основного fallback */}
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
          </div>
        }
      >
        {/* Вызываем async компонент для серверного рендеринга */}
        <HomePageContent />
      </Suspense>
    </GradientBackground>
  );
}
