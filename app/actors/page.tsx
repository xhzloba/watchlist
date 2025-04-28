// Этот файл является серверным компонентом
import { getPopularActors } from "@/lib/tmdb";
import ActorsClientPage from "./client";
import GradientBackground from "@/components/gradient-background";
import Header from "@/components/header";

// Отключаем динамическую перегенерацию страницы для моментального отображения
export const dynamic = "force-static";
export const revalidate = 3600; // Обновлять кеш раз в час

// Устанавливаем приоритет загрузки
export const fetchCache = "force-cache";
export const preferredRegion = "all";

export default async function ActorsPage() {
  // Получаем популярных актеров с первой страницы
  const { actors, total_pages } = await getPopularActors(1);

  // Оборачиваем в GradientBackground как на главной странице
  return (
    <GradientBackground>
      {/* Хедер всегда видимый */}
      <Header />

      {/* Контент без скелетона и Suspense */}
      <div className="pt-24 pb-12">
        <div className="container-fluid mx-auto px-4 sm:px-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-8 font-bebas-neue tracking-wider">
            ПОПУЛЯРНЫЕ АКТЕРЫ
          </h1>
          <ActorsClientPage initialActors={actors} totalPages={total_pages} />
        </div>
      </div>
    </GradientBackground>
  );
}
