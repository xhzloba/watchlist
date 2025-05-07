"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
// import Link from "next/link"; // Link не используется напрямую, убираем
import { useRouter } from "next/navigation"; // Используем next/navigation для App Router
import { type Movie as LocalMovieType } from "@/lib/tmdb"; // Исправленный импорт типа
// import { LocalMovieType } from "@/types"; // Временно комментируем, пока не найден правильный тип

// Функция для перемешивания массива (Fisher-Yates shuffle)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

interface HeroBackdropSliderProps {
  items: LocalMovieType[]; // Используем правильный тип
}

const HeroBackdropSlider: React.FC<HeroBackdropSliderProps> = ({ items }) => {
  const [shuffledClientItems, setShuffledClientItems] = useState<
    LocalMovieType[] | null
  >(null);
  const [activeClientIndex, setActiveClientIndex] = useState(0);
  const [carouselReadyToStart, setCarouselReadyToStart] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Этот эффект подготавливает данные для карусели и запускает таймер для ее старта
    if (items && items.length > 0) {
      const shuffled = shuffleArray([...items]);
      setShuffledClientItems(shuffled);
      setActiveClientIndex(0); // Готовим первый индекс для перемешанного списка

      const startTimer = setTimeout(() => {
        setCarouselReadyToStart(true);
      }, 7000); // Даем 7 секунд на показ серверного/начального элемента

      return () => clearTimeout(startTimer);
    } else {
      // Сброс, если items пуст
      setShuffledClientItems(null);
      setCarouselReadyToStart(false);
    }
  }, [items]);

  useEffect(() => {
    // Этот эффект отвечает за интервал смены слайдов в карусели
    // Запускается только после того, как карусель готова к старту
    if (
      !carouselReadyToStart ||
      !shuffledClientItems ||
      shuffledClientItems.length === 0
    ) {
      return;
    }

    const intervalId = setInterval(() => {
      setActiveClientIndex(
        (prevIndex) => (prevIndex + 1) % shuffledClientItems.length
      );
    }, 7000); // 7 секунд на каждый слайд в карусели

    return () => clearInterval(intervalId);
  }, [carouselReadyToStart, shuffledClientItems]);

  if (!items || items.length === 0) {
    return null;
  }

  // Определяем, какой фильм показывать
  let currentMovie: LocalMovieType;
  let imagePriority: boolean;

  if (!carouselReadyToStart || !shuffledClientItems) {
    // До того как карусель готова, показываем первый элемент из оригинального списка (серверный рендер)
    currentMovie = items[0];
    imagePriority = true; // Высокий приоритет для первого изображения
  } else {
    // Карусель запущена, используем перемешанный список
    currentMovie = shuffledClientItems[activeClientIndex];
    imagePriority = activeClientIndex === 0; // Приоритет для первого элемента *карусели*
    // (если он не совпадает с items[0] и показывается впервые)
    // Хотя, если items[0] уже загружен с priority, это может быть излишним
    // Оставим priority только для изначального items[0]
    imagePriority = !carouselReadyToStart; // Более простой вариант: priority только для серверного items[0]
  }

  if (!currentMovie) {
    return null; // На случай, если что-то пошло не так
  }

  const backdropUrl = currentMovie.backdrop_path
    ? `https://imagetmdb.com/t/p/original${currentMovie.backdrop_path}`
    : "/placeholder-backdrop.jpg";

  const handleBackdropClick = () => {
    // Убедимся, что currentMovie существует перед переходом
    if (currentMovie && currentMovie.id) {
      router.push(`/movie/${currentMovie.id}`);
    }
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
        priority={imagePriority}
      />
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
