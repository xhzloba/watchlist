"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Search,
  Home,
  Monitor,
  PlaySquare,
  Compass,
  MonitorSmartphone,
  Bell,
  ChevronRight,
} from "lucide-react";
import {
  getTrendingMovies,
  getUpcomingMovies,
  getImageUrl,
  getYear,
  formatDate,
  type Movie,
} from "./api/tmdb";

export default function PlexUI() {
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [trending, upcoming] = await Promise.all([
          getTrendingMovies(),
          getUpcomingMovies(),
        ]);

        setTrendingMovies(trending.slice(0, 7));
        setUpcomingMovies(upcoming.slice(0, 5));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Navigation Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-8">
          <div className="text-white font-bold text-2xl">
            <span className="text-white font-bold">plex</span>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <a
            href="#"
            className="flex items-center gap-2 text-white font-medium"
          >
            <Home className="w-4 h-4" />
            <span>Главная</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-2 text-gray-400 font-medium hover:text-white transition-colors"
          >
            <Monitor className="w-4 h-4" />
            <span>ТВ</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-2 text-gray-400 font-medium hover:text-white transition-colors"
          >
            <PlaySquare className="w-4 h-4" />
            <span>По запросу</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-2 text-gray-400 font-medium hover:text-white transition-colors"
          >
            <Compass className="w-4 h-4" />
            <span>Обзор</span>
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <button className="text-gray-400 hover:text-white">
            <MonitorSmartphone className="w-5 h-5" />
          </button>
          <button className="text-gray-400 hover:text-white">
            <Bell className="w-5 h-5" />
          </button>
          <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors">
            Открыть Plex
          </button>
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-medium">
            А
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        {/* Most Added to Watchlists Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium">Популярные фильмы и сериалы</h2>
            <button className="text-white">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 overflow-x-auto pb-4">
              {trendingMovies.map((movie) => (
                <div key={movie.id} className="flex flex-col">
                  <div className="relative aspect-[2/3] rounded-md overflow-hidden mb-2">
                    <Image
                      src={getImageUrl(movie.poster_path) || "/placeholder.svg"}
                      alt={movie.title || movie.name || ""}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h3 className="text-sm font-medium truncate">
                    {movie.title || movie.name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {getYear(movie.release_date || movie.first_air_date)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Trending Trailers Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium">Трейлеры новинок</h2>
            <button className="text-white">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
              {upcomingMovies.map((movie) => (
                <div key={movie.id} className="flex flex-col">
                  <div className="relative aspect-video rounded-md overflow-hidden mb-2">
                    <Image
                      src={getImageUrl(
                        movie.backdrop_path || movie.poster_path,
                        "w780"
                      )}
                      alt={movie.title || ""}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h3 className="text-sm font-medium truncate">
                    {movie.title}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {formatDate(movie.release_date, true)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
