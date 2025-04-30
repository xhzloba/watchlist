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
      getPopularMoviesOnly(),
    ]);

    // Просто преобразуем результат, предполагая, что там только фильмы
    const popularMovies: LocalMovieType[] = popularMoviesData.items.map(
      ensurePlainMovieObject
    );
    console.log(
      "Получено популярных фильмов (без фильтрации):",
      popularMovies.length
    ); // Добавим лог для проверки

    // Преобразуем остальные массивы
    const plainTrending = trending.map(ensurePlainMovieObject);
    const plainLatestTrailers = latestTrailers.map(ensurePlainMovieObject);
    const plainNowPlaying = nowPlaying.map(ensurePlainMovieObject);
    const plainMovies2025 = movies2025.map(ensurePlainMovieObject);
    const plainMovies2024 = movies2024.map(ensurePlainMovieObject);
    const plainRussianMovies = russianMovies.map(ensurePlainMovieObject);
    const plainComedyMovies = comedyMovies.map(ensurePlainMovieObject);
    const plainHorrorMovies = horrorMovies.map(ensurePlainMovieObject);
    const plainActionMovies = actionMovies.map(ensurePlainMovieObject);
    const plainMysteryMovies = mysteryMovies.map(ensurePlainMovieObject);
    const plainScienceFictionMovies = scienceFictionMovies.map(
      ensurePlainMovieObject
    );
    const plainWarMovies = warMovies.map(ensurePlainMovieObject);
    const plainAdventureMovies = adventureMovies.map(ensurePlainMovieObject);
    const plainCrimeMovies = crimeMovies.map(ensurePlainMovieObject);
    const plainFantasyMovies = fantasyMovies.map(ensurePlainMovieObject);
    const plainRomanceMovies = romanceMovies.map(ensurePlainMovieObject);
    const plainHistoryMovies = historyMovies.map(ensurePlainMovieObject);
    const plainAnimationMovies = animationMovies.map(ensurePlainMovieObject);
    const plainDramaMovies = dramaMovies.map(ensurePlainMovieObject);
    const plainFamilyMovies = familyMovies.map(ensurePlainMovieObject);
    const plainWesternMovies = westernMovies.map(ensurePlainMovieObject);

    // Обновляем genreSliders с преобразованными items
    const genreSliders = [
      {
        id: -1,
        title: "ПОПУЛЯРНЫЕ ФИЛЬМЫ ИЗ РОССИИ",
        items: plainRussianMovies.slice(0, 20),
      },
      {
        id: 35,
        title: "ЛУЧШИЕ КОМЕДИИ",
        items: plainComedyMovies.slice(0, 20),
      },
      {
        id: 27,
        title: "УЖАСЫ",
        items: plainHorrorMovies.slice(0, 20),
      },
      {
        id: 28,
        title: "БОЕВИКИ",
        items: plainActionMovies.slice(0, 20),
      },
      {
        id: 9648,
        title: "ДЕТЕКТИВЫ",
        items: plainMysteryMovies.slice(0, 20),
      },
      {
        id: 878,
        title: "ФАНТАСТИКА",
        items: plainScienceFictionMovies.slice(0, 20),
      },
      {
        id: 10752,
        title: "ВОЕННЫЕ ФИЛЬМЫ",
        items: plainWarMovies.slice(0, 20),
      },
      {
        id: 12,
        title: "ПРИКЛЮЧЕНИЯ",
        items: plainAdventureMovies.slice(0, 20),
      },
      {
        id: 80,
        title: "КРИМИНАЛЬНЫЕ ФИЛЬМЫ",
        items: plainCrimeMovies.slice(0, 20),
      },
      {
        id: 14,
        title: "ФЭНТЕЗИ",
        items: plainFantasyMovies.slice(0, 20),
      },
      {
        id: 10749,
        title: "МЕЛОДРАМЫ",
        items: plainRomanceMovies.slice(0, 20),
      },
      {
        id: 36,
        title: "ИСТОРИЧЕСКИЕ ФИЛЬМЫ",
        items: plainHistoryMovies.slice(0, 20),
      },
      {
        id: 16,
        title: "МУЛЬТФИЛЬМЫ",
        items: plainAnimationMovies.slice(0, 20),
      },
      {
        id: 18,
        title: "ДРАМЫ",
        items: plainDramaMovies.slice(0, 20),
      },
      {
        id: 10751,
        title: "СЕМЕЙНЫЕ ФИЛЬМЫ",
        items: plainFamilyMovies.slice(0, 20),
      },
      {
        id: 37,
        title: "ВЕСТЕРНЫ",
        items: plainWesternMovies.slice(0, 20),
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
              disableGlowEffect={true}
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
              disableGlowEffect={true}
            />
            <MovieRow
              title="ПОПУЛЯРНОЕ НА WATCHLIST"
              items={popularMovies.slice(0, 20)} // Передаем результат без фильтрации
              variant="poster"
              posterSize="large"
              showDate
              showYear
              viewAllLink="/popular" // <--- Добавляем ссылку "Показать все"
              disableGlowEffect={true}
            />
            <MovieRow
              title="СЕЙЧАС СМОТРЯТ"
              items={nowPlaying.slice(0, 20)}
              variant="poster"
              posterSize="large"
              showDate
              showYear
              disableGlowEffect={true}
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
              disableGlowEffect={true}
            />
            <MovieRow
              title="ЛУЧШИЕ ФИЛЬМЫ 2024 ГОДА ПО ОЦЕНКАМ"
              items={movies2024.slice(0, 20)}
              variant="backdrop"
              backdropSize="large"
              showDate
              showYear
              showLogo
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
                  posterSize="large"
                  actorImage={slider.actor.imageUrl}
                  showDate
                  showYear
                  viewAllLink={`/actors/${slider.actor.id}`}
                  disableGlowEffect={true}
                />
              ) : (
                // Жанровые ряды
                <MovieRow
                  key={`genre-${index}`}
                  title={slider.title}
                  items={slider.items}
                  variant="poster"
                  posterSize="large"
                  showDate
                  showYear
                  keywordIds={
                    slider.genreId !== -1 ? [slider.genreId] : undefined
                  }
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
