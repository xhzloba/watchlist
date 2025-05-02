import "./globals.css";
import type { Metadata } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import PageTransition from "@/components/page-transition";
import { ColorProvider } from "@/contexts/color-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { WatchlistProvider } from "@/contexts/watchlist-context";
import { ReleaseQualityProvider } from "@/components/movie-card-wrapper";
import { ViewingHistoryProvider } from "@/contexts/viewing-history-context";
import { UsernameProvider } from "@/contexts/username-context";
import { UISettingsProvider } from "@/context/UISettingsContext";
import { Suspense } from "react";
import dynamic from "next/dynamic";

// Импортируем хедер как клиентский компонент, предотвращая гидратацию на сервере
const Header = dynamic(() => import("@/components/header"), {
  ssr: true, // Оставляем SSR, но отделяем от основной гидратации
});

const inter = Inter({ subsets: ["latin", "cyrillic"] });
const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
});

// Fallback компонент для Header
function HeaderFallback() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-zinc-900/80 backdrop-blur-sm">
      <div className="container-fluid mx-auto py-3 px-4 md:py-4 md:px-6">
        <div className="flex items-center justify-between w-full gap-4">
          <div className="flex items-center flex-shrink-0">
            {/* Имитация лого */}
            <div className="w-[80px] h-8 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-lg"></div>

            {/* Имитация навигации */}
            <div className="hidden md:flex items-center gap-6 ml-10">
              <div className="w-16 h-5 bg-gray-700/30 rounded-full animate-pulse"></div>
              <div className="w-24 h-5 bg-gray-700/30 rounded-full animate-pulse"></div>
              <div className="w-16 h-5 bg-gray-700/30 rounded-full animate-pulse"></div>
              <div className="w-20 h-5 bg-gray-700/30 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Имитация правой части с аватаром */}
          <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 animate-pulse"></div>
            <div className="hidden md:block w-24 h-6 bg-gray-700/30 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Фильмы и сериалы онлайн",
  description: "Смотрите фильмы и сериалы онлайн на нашей платформе",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`bg-[#121212] ${bebasNeue.variable}`}>
      <body className={`${inter.className} bg-[#121212] text-white`}>
        <NextTopLoader color="#FFCC00" showSpinner={false} height={3} />
        <WatchlistProvider>
          <NotificationProvider>
            <ColorProvider>
              <ReleaseQualityProvider>
                <ViewingHistoryProvider>
                  <UsernameProvider>
                    <UISettingsProvider>
                      {/* Удаляем Suspense, так как dynamic компонент уже имеет свой loading */}
                      <Header />
                      <PageTransition>{children}</PageTransition>
                    </UISettingsProvider>
                  </UsernameProvider>
                </ViewingHistoryProvider>
              </ReleaseQualityProvider>
            </ColorProvider>
          </NotificationProvider>
        </WatchlistProvider>
      </body>
    </html>
  );
}
