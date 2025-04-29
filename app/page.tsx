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
  type Movie,
} from "@/lib/tmdb";
import { getAllActorsInfo, getAllActorsMovies } from "@/lib/actors";
import dynamic from "next/dynamic";
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
    ] = await Promise.all([
      getTrendingMovies(),
      getNowPlayingMovies(),
      getLatestTrailers(),
      getBestMoviesOf2025(),
      getBestMoviesOf2024(),
      getRussianMovies(),
      getMoviesByGenre(35), // Комедия
      getMoviesByGenre(27), // Ужасы
      getMoviesByGenre(28), // Боевики
      getMoviesByGenre(9648), // Детективы
      getMoviesByGenre(878), // Фантастика
      getMoviesByGenre(10752), // Военные
      getMoviesByGenre(12), // Приключения
      getMoviesByGenre(80), // Криминал
      getMoviesByGenre(14), // Фэнтези
      getMoviesByGenre(10749), // Мелодрама
      getMoviesByGenre(36), // История
      getMoviesByGenre(16), // Мультфильм
      getMoviesByGenre(18), // Драма
      getMoviesByGenre(10751), // Семейный
      getMoviesByGenre(37), // Вестерн
    ]);

    // Создаем массив всех жанровых слайдеров для перемешивания
    const genreSliders = [
      {
        title: "ПОПУЛЯРНЫЕ ФИЛЬМЫ ИЗ РОССИИ",
        items: russianMovies.slice(0, 20),
      },
      {
        title: "ЛУЧШИЕ КОМЕДИИ",
        items: comedyMovies.slice(0, 20),
      },
      {
        title: "УЖАСЫ",
        items: horrorMovies.slice(0, 20),
      },
      {
        title: "БОЕВИКИ",
        items: actionMovies.slice(0, 20),
      },
      {
        title: "ДЕТЕКТИВЫ",
        items: mysteryMovies.slice(0, 20),
      },
      {
        title: "ФАНТАСТИКА",
        items: scienceFictionMovies.slice(0, 20),
      },
      {
        title: "ВОЕННЫЕ ФИЛЬМЫ",
        items: warMovies.slice(0, 20),
      },
      {
        title: "ПРИКЛЮЧЕНИЯ",
        items: adventureMovies.slice(0, 20),
      },
      {
        title: "КРИМИНАЛЬНЫЕ ФИЛЬМЫ",
        items: crimeMovies.slice(0, 20),
      },
      {
        title: "ФЭНТЕЗИ",
        items: fantasyMovies.slice(0, 20),
      },
      {
        title: "МЕЛОДРАМЫ",
        items: romanceMovies.slice(0, 20),
      },
      {
        title: "ИСТОРИЧЕСКИЕ ФИЛЬМЫ",
        items: historyMovies.slice(0, 20),
      },
      {
        title: "МУЛЬТФИЛЬМЫ",
        items: animationMovies.slice(0, 20),
      },
      {
        title: "ДРАМЫ",
        items: dramaMovies.slice(0, 20),
      },
      {
        title: "СЕМЕЙНЫЕ ФИЛЬМЫ",
        items: familyMovies.slice(0, 20),
      },
      {
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
      items: Movie[];
    };

    type GenreSlider = {
      type: "genre";
      title: string;
      items: Movie[];
    };

    type CombinedSlider = ActorSlider | GenreSlider;

    const actorSliders: ActorSlider[] = shuffledActors.map((actor) => ({
      type: "actor",
      actor,
      title: actor.title,
      items: actorsMovies[actor.id].slice(0, 100),
    }));

    const genreSliders2: GenreSlider[] = shuffledGenreSliders.map((slider) => ({
      type: "genre",
      title: slider.title,
      items: slider.items,
    }));

    // Объединяем и перемешиваем все слайдеры
    const allSliders: CombinedSlider[] = shuffleArray([
      ...actorSliders,
      ...genreSliders2,
      // Добавляем российские фильмы как отдельный слайдер в перемешанный список
    ]);

    // Сортируем фильмы по показателю популярности в убывающем порядке
    return (
      <div className="min-h-screen text-white">
        {/* Header остается клиентским компонентом, так как использует хуки */}
        <Header />
        <main className="pt-32 pb-8">
          <div className="container-fluid mx-auto space-y-8">
            {/* Фиксированные первые 3 слайдера */}
            <MovieRow
              title="В тренде за неделю"
              items={trending.slice(0, 20)}
              variant="poster"
              posterSize="large"
              showDate
              showYear
            />
            <MovieRow
              title="ПОСЛЕДНИЕ ДОБАВЛЕННЫЕ ТРЕЙЛЕРЫ"
              items={latestTrailers.slice(0, 20)}
              variant="backdrop"
              backdropSize="large"
              showDate
              showYear
              showLogo
              isTrailerSection
            />
            <MovieRow
              title="СЕЙЧАС СМОТРЯТ"
              items={nowPlaying.slice(0, 20)}
              variant="poster"
              posterSize="large"
              showDate
              showYear
            />
            {/* Полоса жанров */}
            <GenreStrip />
            <MovieRow
              title="ЛУЧШИЕ ФИЛЬМЫ 2025 ГОДА ПО ОЦЕНКАМ"
              items={movies2025.slice(0, 20)}
              variant="backdrop"
              backdropSize="large"
              showDate
              showYear
              showLogo
            />
            <MovieRow
              title="ЛУЧШИЕ ФИЛЬМЫ 2024 ГОДА ПО ОЦЕНКАМ"
              items={movies2024.slice(0, 20)}
              variant="backdrop"
              backdropSize="large"
              showDate
              showYear
              showLogo
            />
            {/* История просмотров загружается динамически на клиенте */}
            <div className="mt-8">
              <ViewingHistoryRow />
            </div>

            {/* Объединенные и перемешанные слайдеры актеров и жанров */}
            {allSliders.map((slider, index) =>
              slider.type === "actor" ? (
                <MovieRow
                  key={`actor-${slider.actor.id}`}
                  title={slider.title}
                  items={slider.items}
                  variant="poster"
                  posterSize="large"
                  actorImage={slider.actor.imageUrl}
                  showDate
                  showYear
                />
              ) : (
                <MovieRow
                  key={`genre-${index}`}
                  title={slider.title}
                  items={slider.items}
                  variant="poster"
                  posterSize="large"
                  showDate
                  showYear
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
      <Suspense
        fallback={
          // Фолбэк для Suspense, пока грузятся серверные данные
          <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
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
