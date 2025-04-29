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
import { Suspense } from "react";
import Header from "@/components/header";

const inter = Inter({ subsets: ["latin", "cyrillic"] });
const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
});

// Fallback компонент для Header (можно сделать его минималистичным)
const HeaderFallback = () => (
  // Простой div с высотой хедера и фоном, чтобы избежать скачка
  <div className="fixed top-0 left-0 right-0 z-[60] h-[68px] bg-zinc-900/80 backdrop-blur-sm"></div>
);

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
                    {/* Оборачиваем Header в Suspense */}
                    <Suspense fallback={<HeaderFallback />}>
                      <Header />
                    </Suspense>
                    {/* Оборачиваем Suspense + children в div */}
                    <div>
                      <Suspense
                        fallback={
                          <div className="fixed inset-0 flex items-center justify-center bg-[#121212] z-50">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
                          </div>
                        }
                      >
                        {/* Убрали PageTransition */}
                        {children}
                      </Suspense>
                    </div>
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
