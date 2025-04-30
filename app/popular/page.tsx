import { Suspense } from "react";
import Header from "@/components/header";
import GradientBackground from "@/components/gradient-background";
// Импортируем новый клиентский компонент
import PopularContent from "@/components/popular-content";

// Указываем Next.js рендерить эту страницу динамически
export const dynamic = "force-dynamic";

// Основной экспорт страницы - это серверный компонент
export default function PopularPage() {
  return (
    <GradientBackground>
      <Header />
      {/* Оборачиваем КЛИЕНТСКИЙ компонент PopularContent в Suspense */}
      <Suspense
        fallback={
          <div className="fixed inset-0 flex items-center justify-center bg-[#121212] z-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
          </div>
        }
      >
        {/* Вызываем импортированный компонент */}
        <PopularContent />
      </Suspense>
    </GradientBackground>
  );
}
