// Убираем "use client"; чтобы сделать компонент серверным
// "use client";

import { Suspense } from "react";
import Header from "@/components/header";
import GradientBackground from "@/components/gradient-background";
import { fetchKeywordMovies } from "@/lib/keywords";
import KeywordCollection from "@/components/keyword-collection";

interface KeywordCollectionType {
  title: string;
  keywordIds: number[];
  description?: string;
  variant?: "poster" | "backdrop"; // Добавляем варианты отображения
  useTrailerStyle?: boolean; // Новое свойство для стиля трейлеров без функциональности трейлеров
  showLogo?: boolean;
}

// Коллекции с правильными настройками отображения
const allKeywordCollections: KeywordCollectionType[] = [
  {
    title: "Фильмы про Вторую мировую войну",
    keywordIds: [1956],
    description:
      "Драматические и исторические картины о событиях 1939-1945 годов",
    variant: "backdrop", // Горизонтальные карточки
    useTrailerStyle: true, // С эффектами трейлеров
    showLogo: true,
  },
  {
    title: "Фильмы про супергероев",
    keywordIds: [9715],
    description: "Захватывающие приключения людей со сверхспособностями",
    variant: "poster", // Вертикальные постеры
  },
  {
    title: "Экранизации книг",
    keywordIds: [818],
    description: "Знаменитые литературные произведения, воплощенные на экране",
    variant: "backdrop", // Горизонтальные карточки
    useTrailerStyle: true, // Без эффектов трейлеров
    showLogo: true,
  },
  {
    title: "Фильмы про искусственный интеллект",
    keywordIds: [310],
    description:
      "Увлекательные истории о разуме машин и их взаимодействии с человеком",
    variant: "poster", // Изменено на постеры, как для супергероев
  },
  {
    title: "Человек против машины",
    keywordIds: [312],
    description:
      "Драматические истории о конфликтах и противостоянии людей и технологий",
    variant: "backdrop",
    useTrailerStyle: true, // Использовать стиль как для трейлеров
    showLogo: true,
  },
  {
    title: "Мир антиутопий",
    keywordIds: [4565], // dystopia
    description:
      "Мрачные версии будущего, тоталитарные режимы и борьба за свободу",
    variant: "backdrop", // Вертикальные постеры
    useTrailerStyle: true,
    showLogo: true,
  },
  {
    title: "Киберпанк",
    keywordIds: [12190],
    description:
      "Высокие технологии и низкая жизнь: мир хакеров, корпораций и технологических антиутопий",
    variant: "backdrop", // Вертикальные постеры
    useTrailerStyle: true,
    showLogo: true,
  },
  {
    title: "Пришельцы среди нас",
    keywordIds: [9951], // alien
    description:
      "Встречи с инопланетянами: от враждебных вторжений до дружеских контактов",
    variant: "backdrop", // Вертикальные постеры
    useTrailerStyle: true,
    showLogo: true,
  },
  {
    title: "Конец света",
    keywordIds: [10150], // end of the world
    description:
      "Фильмы-катастрофы и апокалиптические сценарии гибели цивилизации",
    variant: "backdrop", // Вертикальные постеры
    useTrailerStyle: true,
    showLogo: true,
  },
  {
    title: "Постапокалипсис",
    keywordIds: [4458], // post-apocalyptic future
    description:
      "Выживание в мире после катастрофы: фильмы о жизни после конца цивилизации",
    variant: "backdrop", // Вертикальные постеры
    useTrailerStyle: true,
    showLogo: true,
  },
  {
    title: "Серийные убийцы",
    keywordIds: [10714], // serial killer
    description:
      "Психологические триллеры и детективы о поимке опасных преступников",
    variant: "backdrop", // Вертикальные постеры
    useTrailerStyle: true,
    showLogo: true,
  },
  {
    title: "Кровожадные вампиры",
    keywordIds: [3133],
    description: "Лучшие леденящие кровь вампирские истории",
    variant: "backdrop", // Вертикальные постеры
    useTrailerStyle: true,
    showLogo: true,
  },
  {
    title: "Англия, Лондон",
    keywordIds: [212],
    description: "Фильмы, снятые в Лондоне, Англия",
    variant: "backdrop", // Вертикальные постеры
    useTrailerStyle: true,
    showLogo: true,
  },
];

// Функция для перемешивания массива (алгоритм Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Основной компонент страницы остается без изменений в логике,
// но теперь будет выполняться на сервере
async function KeywordsContent() {
  // Перемешиваем коллекции (с двумя элементами эффект будет минимальный)
  const shuffledCollections = shuffleArray(allKeywordCollections);

  // Загружаем все коллекции параллельно
  const collectionsWithMovies = await Promise.all(
    shuffledCollections.map(async (collection) => {
      const moviesData = await fetchKeywordMovies(collection.keywordIds);
      return {
        ...collection,
        movies: moviesData.results.slice(0, 20), // Ограничиваем до 20 фильмов
      };
    })
  );

  return (
    <div className="min-h-screen text-white">
      <Header />
      <main className="pt-32 pb-8 space-y-8">
        {collectionsWithMovies.map((collection, index) => (
          <KeywordCollection
            key={index}
            title={collection.title}
            keywordIds={collection.keywordIds}
            description={collection.description}
            movies={collection.movies}
            variant={collection.variant}
            useTrailerStyle={collection.useTrailerStyle}
            showLogo={collection.showLogo}
          />
        ))}
      </main>
    </div>
  );
}

// Экспорт по умолчанию с Suspense остается
export default function KeywordsPage() {
  return (
    <GradientBackground>
      <Suspense
        fallback={
          // Используем тот же фолбэк, что и на главной
          <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
          </div>
        }
      >
        <KeywordsContent />
      </Suspense>
    </GradientBackground>
  );
}
