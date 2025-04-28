"use client";

import { useState, useEffect, Suspense } from "react";
import Header from "@/components/header";
import GradientBackground from "@/components/gradient-background";

function DebugContent() {
  const [watchlist, setWatchlist] = useState<any[]>([]);

  useEffect(() => {
    try {
      const data = localStorage.getItem("watchlist");
      if (data) {
        const parsed = JSON.parse(data);
        setWatchlist(parsed);
      }
    } catch (error) {
      console.error("Ошибка при загрузке данных:", error);
    }
  }, []);

  function clearWatchlist() {
    localStorage.removeItem("watchlist");
    setWatchlist([]);
  }

  return (
    <div className="min-h-screen text-white">
      <Header />
      <main className="pt-32 pb-8 container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">
          Отладка хранилища избранного
        </h1>

        <div className="bg-black/30 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl">Текущий список избранного:</h2>
            <button
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={clearWatchlist}
            >
              Очистить
            </button>
          </div>

          {watchlist.length === 0 ? (
            <p className="text-gray-400">Список пуст</p>
          ) : (
            <pre className="bg-black/50 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(watchlist, null, 2)}
            </pre>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DebugPage() {
  return (
    <GradientBackground>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
          </div>
        }
      >
        <DebugContent />
      </Suspense>
    </GradientBackground>
  );
}
