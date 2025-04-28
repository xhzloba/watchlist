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

const inter = Inter({ subsets: ["latin", "cyrillic"] });
const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
});

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
                    <PageTransition>{children}</PageTransition>
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
