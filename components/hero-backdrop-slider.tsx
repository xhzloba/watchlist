"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
// import Link from "next/link"; // Link не используется напрямую, убираем
import { useRouter } from "next/navigation"; // Используем next/navigation для App Router
import {
  type Movie as LocalMovieType,
  getMovieLogos,
  getYear,
} from "@/lib/tmdb"; // Исправленный импорт типа и добавлена getMovieLogos, getYear
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
  // Предполагается, что логотип может быть не у всех фильмов,
  // или его загрузка может быть опциональной в будущем.
  // Если логотип обязателен, можно убрать ' | null | undefined'.
  // logoUrl?: string | null; // Удалим это, так как логотип будет загружаться внутри компонента
}

// Helper function to format runtime from minutes to "Xh Ym"
const formatRuntime = (runtimeMinutes?: number): string => {
  if (
    runtimeMinutes === null ||
    runtimeMinutes === undefined ||
    runtimeMinutes === 0
  ) {
    return ""; // Или "N/A", если нужно
  }
  const hours = Math.floor(runtimeMinutes / 60);
  const minutes = runtimeMinutes % 60;
  let formattedRuntime = "";
  if (hours > 0) {
    formattedRuntime += `${hours}ч`;
  }
  if (minutes > 0) {
    if (hours > 0) formattedRuntime += " "; // Пробел между часами и минутами
    formattedRuntime += `${minutes}м`;
  }
  return formattedRuntime;
};

const HeroBackdropSlider: React.FC<HeroBackdropSliderProps> = ({ items }) => {
  const [shuffledClientItems, setShuffledClientItems] = useState<
    LocalMovieType[] | null
  >(null);
  const [activeClientIndex, setActiveClientIndex] = useState(0);
  const [carouselReadyToStart, setCarouselReadyToStart] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0.3); // Начальная прозрачность оверлея
  const [currentMovieLogoUrl, setCurrentMovieLogoUrl] = useState<string | null>(
    null
  );
  const [detailsStyle, setDetailsStyle] = useState<React.CSSProperties>({
    opacity: 1,
    pointerEvents: "auto",
    transition: "opacity 0.3s ease-out",
  });
  const router = useRouter();
  const [isLogoLoading, setIsLogoLoading] = useState(false); // Новое состояние для лоадера

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

  useEffect(() => {
    // Обработчик скролла для изменения прозрачности оверлея и деталей фильма
    const handleScroll = () => {
      const scrollY = window.scrollY;

      // Логика для прозрачности оверлея
      const overlayScrollThreshold = 300;
      const minOverlayOpacity = 0.3;
      const maxOverlayOpacity = 0.85;
      const overlayOpacityRange = maxOverlayOpacity - minOverlayOpacity;
      let overlayScrollFraction = Math.min(scrollY / overlayScrollThreshold, 1);
      const newOverlayOpacity =
        minOverlayOpacity + overlayOpacityRange * overlayScrollFraction;
      setOverlayOpacity(newOverlayOpacity);

      // Логика для прозрачности и доступности блока деталей
      const detailsFadeStartScrollY = 50; // Начать скрытие деталей
      const detailsFadeEndScrollY = 150; // Детали полностью скрыты
      let newDetailsOpacity = 1;

      if (scrollY <= detailsFadeStartScrollY) {
        newDetailsOpacity = 1;
      } else if (scrollY >= detailsFadeEndScrollY) {
        newDetailsOpacity = 0;
      } else {
        newDetailsOpacity =
          1 -
          (scrollY - detailsFadeStartScrollY) /
            (detailsFadeEndScrollY - detailsFadeStartScrollY);
      }

      setDetailsStyle({
        opacity: newDetailsOpacity,
        pointerEvents: newDetailsOpacity === 0 ? "none" : "auto",
        transition: "opacity 0.3s ease-out", // Плавный переход
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []); // Пустой массив зависимостей, чтобы эффект выполнился один раз

  // Определяем, какой фильм показывать
  let currentMovie: LocalMovieType | undefined;
  let imagePriority: boolean;

  if (!carouselReadyToStart || !shuffledClientItems) {
    // До того как карусель готова, показываем первый элемент из оригинального списка (серверный рендер)
    currentMovie = items && items.length > 0 ? items[0] : undefined;
    imagePriority = true; // Высокий приоритет для первого изображения
  } else {
    // Карусель запущена, используем перемешанный список
    currentMovie = shuffledClientItems[activeClientIndex];
    imagePriority = !carouselReadyToStart; // Более простой вариант: priority только для серверного items[0]
  }

  useEffect(() => {
    // Загрузка логотипа для текущего фильма
    if (currentMovie && currentMovie.id) {
      setCurrentMovieLogoUrl(null); // Сбрасываем предыдущий логотип
      setIsLogoLoading(true); // Начинаем загрузку логотипа
      getMovieLogos(currentMovie.id)
        .then((logoData) => {
          if (logoData && logoData.logos && logoData.logos.length > 0) {
            // Предпочитаем русский, потом английский, потом первый доступный
            const ruLogo = logoData.logos.find(
              (logo: any) => logo.iso_639_1 === "ru"
            );
            const enLogo = logoData.logos.find(
              (logo: any) => logo.iso_639_1 === "en"
            );
            const preferredLogo = ruLogo || enLogo || logoData.logos[0];

            if (preferredLogo && preferredLogo.file_path) {
              setCurrentMovieLogoUrl(
                `https://imagetmdb.com/t/p/original${preferredLogo.file_path}`
              );
            }
          }
        })
        .catch((error) => {
          console.error("Ошибка загрузки логотипа:", error);
          setCurrentMovieLogoUrl(null); // Убедимся, что лого не показывается при ошибке
        })
        .finally(() => {
          setIsLogoLoading(false); // Заканчиваем загрузку логотипа
        });
    } else {
      setCurrentMovieLogoUrl(null); // Если фильма нет, логотипа тоже нет
      setIsLogoLoading(false); // Убедимся, что лоадер выключен
    }
  }, [currentMovie]); // Перезагружаем логотип при смене currentMovie

  if (!items || items.length === 0 || !currentMovie) {
    return null;
  }

  const ratingValue = currentMovie.vote_average;
  const ratingText = ratingValue ? ratingValue.toFixed(1) : "-";
  let ratingBgClass = "bg-gray-600"; // Default
  if (ratingValue && ratingValue !== 0) {
    // Добавим проверку на 0, чтобы не было красным если просто нет данных
    if (ratingValue >= 7.0) {
      ratingBgClass = "bg-green-600";
    } else if (ratingValue >= 5.5) {
      ratingBgClass = "bg-gray-600";
    } else {
      ratingBgClass = "bg-red-600";
    }
  } else if (
    ratingValue === 0 &&
    currentMovie.vote_count &&
    currentMovie.vote_count > 0
  ) {
    // Если рейтинг 0, но есть голоса, это вероятно низкий рейтинг
    ratingBgClass = "bg-red-600";
  }

  const year = getYear(currentMovie.release_date);
  const runtimeFormatted = formatRuntime(currentMovie.runtime);
  const genresText =
    currentMovie.genres && currentMovie.genres.length > 0
      ? currentMovie.genres.map((g) => g.name).join(", ")
      : "";

  let releaseQualityDisplay: string | undefined = undefined;
  if (currentMovie.release_quality) {
    if (typeof currentMovie.release_quality === "string") {
      releaseQualityDisplay = currentMovie.release_quality;
    } else if (
      typeof currentMovie.release_quality === "object" &&
      currentMovie.release_quality.type
    ) {
      releaseQualityDisplay = currentMovie.release_quality.type;
    }
  } else if (currentMovie.releaseQuality) {
    // Fallback
    releaseQualityDisplay = currentMovie.releaseQuality;
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
      className="fixed top-0 left-0 right-0 w-full h-[60vh] md:h-[75vh] cursor-pointer z-0 [mask-image:linear-gradient(to_bottom,white_calc(100%-150px),transparent_100%)]"
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
      <div
        className="absolute inset-0 transition-opacity duration-100"
        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
      ></div>
      {/* Контейнер для логотипа или названия и остальной информации */}
      <div
        className="absolute top-1/2 left-10 md:left-20 transform -translate-y-1/2 z-10 max-w-[calc(100%-80px)] md:max-w-[calc(100%-160px)] text-white"
        style={detailsStyle} // Применяем стиль для управления видимостью и доступностью
      >
        <div className="mb-4 h-[150px] flex items-end">
          {" "}
          {/* Задаем фиксированную высоту для контейнера лого/тайтла/лоадера */}
          {isLogoLoading ? (
            <div className="w-[50px] h-[50px] animate-spin rounded-full border-t-2 border-b-2 border-yellow-500"></div> /* Простой лоадер */
          ) : currentMovieLogoUrl ? (
            <Image
              src={currentMovieLogoUrl}
              alt={`${currentMovie.title || "Movie"} logo`}
              width={300} // Средний размер, можно настроить
              height={150} // Пропорционально, можно настроить
              style={{
                objectFit: "contain",
                maxWidth: "300px",
                maxHeight: "150px",
              }} // Используем style для objectFit и размеров
              className="max-w-xs md:max-w-sm h-auto" // Ограничение максимальной ширины и авто высота
            />
          ) : (
            currentMovie.title && (
              <h1 className="text-3xl md:text-5xl font-bold drop-shadow-lg">
                {currentMovie.title}
              </h1>
            )
          )}
        </div>

        {/* Рейтинг, год, продолжительность, жанры */}
        <div className="flex flex-col space-y-2">
          <div className="flex flex-row items-center space-x-3 text-sm md:text-base">
            {ratingText !== "N/A" &&
              ratingValue !== 0 && ( // Не показываем рейтинг если N/A или 0 без голосов
                <span
                  className={`px-2 py-1 text-white font-semibold rounded-md text-xs md:text-sm ${ratingBgClass}`}
                >
                  {ratingText}
                </span>
              )}
            {year !== "Дата неизвестна" && <span>{year}</span>}
            {releaseQualityDisplay && (
              <span className="text-xs md:text-sm uppercase bg-black/20 px-1.5 py-0.5 rounded-sm">
                {releaseQualityDisplay}
              </span>
            )}
            {runtimeFormatted && <span>{runtimeFormatted}</span>}
          </div>
          {genresText && (
            <p className="text-xs md:text-sm text-gray-300">{genresText}</p>
          )}
        </div>

        {/* Описание фильма */}
        {currentMovie.overview && (
          <>
            <p className="mt-3 text-sm md:text-base max-w-md md:max-w-lg text-gray-200 leading-relaxed line-clamp-4 md:line-clamp-8">
              {currentMovie.overview}
            </p>
            {/* Кнопка "Смотреть" - только для десктопа */}
            <div className="hidden md:block mt-6">
              <button
                onClick={() => router.push(`/movie/${currentMovie.id}`)}
                className="
                  flex justify-center items-center 
                  h-[52px] py-[14px] px-[28px] 
                  text-white text-base font-semibold leading-5 
                  rounded-full border-none 
                  bg-[linear-gradient(135deg,#FF5500_69.93%,#D6BB00_100%)] 
                  hover:brightness-110 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-yellow-400 
                  transition-all duration-200 ease-in-out transform hover:scale-105
                "
              >
                Смотреть
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HeroBackdropSlider;
