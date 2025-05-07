"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
// import Link from "next/link"; // Link не используется напрямую, убираем
import { useRouter } from "next/navigation"; // Используем next/navigation для App Router
import { type Movie as LocalMovieType } from "@/lib/tmdb"; // Исправленный импорт типа
// import { LocalMovieType } from "@/types"; // Временно комментируем, пока не найден правильный тип

interface HeroBackdropSliderProps {
  items: LocalMovieType[]; // Используем правильный тип
}

const HeroBackdropSlider: React.FC<HeroBackdropSliderProps> = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!items || items.length === 0) return;

    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, 3000); // Меняем каждые 3 секунды

    return () => clearInterval(intervalId);
  }, [items]);

  if (!items || items.length === 0) {
    return null; // Не рендерим ничего, если нет элементов
  }

  const currentMovie = items[currentIndex];
  const backdropUrl = currentMovie.backdrop_path
    ? `https://imagetmdb.com/t/p/original${currentMovie.backdrop_path}` // Возвращаем исходный URL
    : "/placeholder-backdrop.jpg"; // Запасное изображение, если нет бэкдропа

  const handleBackdropClick = () => {
    router.push(`/movie/${currentMovie.id}`);
  };

  return (
    <div
      className="relative w-full h-[60vh] md:h-[75vh] cursor-pointer [mask-image:linear-gradient(to_bottom,white_calc(100%-150px),transparent_100%)]"
      onClick={handleBackdropClick}
    >
      <Image
        src={backdropUrl}
        alt={currentMovie.title || "Movie backdrop"}
        layout="fill"
        objectFit="cover"
        className="transition-opacity duration-500 ease-in-out"
        priority={true} // Первый бэкдроп загружаем с приоритетом
      />
      {/* Статичное затемнение, без изменения по ховеру */}
      <div className="absolute inset-0 bg-black bg-opacity-30 transition-opacity duration-300"></div>
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 bg-gradient-to-t from-black via-black/70 to-transparent">
        <h2 className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg">
          {currentMovie.title}
        </h2>
        {currentMovie.overview && (
          <p className="text-sm md:text-base text-gray-300 mt-2 max-w-2xl line-clamp-2 md:line-clamp-3 drop-shadow-md">
            {currentMovie.overview}
          </p>
        )}
      </div>
    </div>
  );
};

export default HeroBackdropSlider;
