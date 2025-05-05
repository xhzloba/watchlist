"use client";

import {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
  useContext,
  useMemo,
  memo,
} from "react";
import NextImage from "next/image";
import ColorThief from "colorthief";
import {
  Shuffle,
  Check,
  Share2,
  ChevronDown,
  X,
  AlertTriangle,
  User,
  Play,
  Star,
  Moon,
  ChevronLeft,
  ChevronRight,
  Building2,
  MessageCircle,
  ThumbsUp,
  Film,
  Info,
} from "lucide-react";
import type { Movie, Cast } from "@/lib/tmdb";
import {
  getImageUrl,
  getYear,
  formatDate,
  getMovieDetail,
  getMovieCredits,
  getMovieCollection,
  getMovieRecommendations,
  getMovieSimilar,
  getMovieVideos,
  getMovieImages,
  getMovieCertification,
  getMovieLogos,
  getPersonMovieCredits, // Добавляем импорт
} from "@/lib/tmdb";
import { motion, AnimatePresence } from "framer-motion";
import { useColorContext } from "@/contexts/color-context";
import WatchlistButtonWrapper from "@/components/watchlist-button-wrapper";
import { useWatchlist } from "@/contexts/watchlist-context";
import { useViewingHistory } from "@/contexts/viewing-history-context";
import { playSound } from "@/lib/sound-utils";
import { useRouter } from "next/navigation";
import ReactCountryFlag from "react-country-flag";
import MovieCardWrapper, {
  useReleaseQualityVisibility,
} from "@/components/movie-card-wrapper";
import MovieRow from "@/components/movie-row";
import Image from "next/image";
import Link from "next/link";
import { useKinobox } from "../hooks/use-kinobox";
import { cn } from "@/lib/utils";
import { useDiscussions, Discussion } from "../hooks/use-discussions"; // Добавляем импорт хука
import dynamic from "next/dynamic";
import ActorNotification from "./actor-notification"; // <-- Новый импорт

// Словарь с переводами стран на русский язык
const countryNames: Record<string, string> = {
  US: "США",
  GB: "Великобритания",
  RU: "Россия",
  CA: "Канада",
  FR: "Франция",
  DE: "Германия",
  IT: "Италия",
  ES: "Испания",
  CN: "Китай",
  JP: "Япония",
  KR: "Южная Корея",
  IN: "Индия",
  AU: "Австралия",
  NZ: "Новая Зеландия",
  MX: "Мексика",
  BR: "Бразилия",
  SE: "Швеция",
  NO: "Норвегия",
  FI: "Финляндия",
  DK: "Дания",
  IS: "Исландия",
  UA: "Украина",
  BY: "Беларусь",
  PL: "Польша",
  CZ: "Чехия",
  HU: "Венгрия",
};

// Получение русского названия страны по ISO коду
const getCountryNameRU = (countryCode: string): string => {
  return countryNames[countryCode] || countryCode;
};

// --- HELPER FUNCTIONS FOR COLOR EXTRACTION (Moved Outside Component) ---

// Функция для определения яркости цвета
const getLuminance = (rgb: number[]) => {
  const [r, g, b] = rgb;
  // Формула для расчета воспринимаемой яркости
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

// Функция для определения, является ли цвет красноватым
const isReddish = (rgb: number[]) => {
  const [r, g, b] = rgb;
  // Красный значительно больше других каналов
  return r > g * 1.3 && r > b * 1.3;
};

// Функция для определения сильно красного цвета (действительно доминантного)
const isStronglyReddish = (rgb: number[]) => {
  const [r, g, b] = rgb;
  // Красный ОЧЕНЬ сильно доминирует над другими каналами
  return r > g * 1.7 && r > b * 1.7 && r > 100;
};

// Функция для проверки и коррекции бледных цветов
const avoidPaleColors = (rgb: number[]) => {
  // Получаем яркость и насыщенность
  const luminance = (rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114) / 255;

  // Находим максимальный и минимальный каналы
  const max = Math.max(...rgb);
  const min = Math.min(...rgb);
  const saturation = max === 0 ? 0 : (max - min) / max;

  // Если цвет слишком бледный (высокая яркость + низкая насыщенность)
  if (luminance > 0.7 && saturation < 0.3) {
    // Создаем более насыщенную и темную версию
    return [
      Math.round(rgb[0] * 0.6),
      Math.round(rgb[1] * 0.6),
      Math.round(rgb[2] * 0.65),
    ];
  }

  // Для слишком темных цветов немного повышаем яркость
  if (luminance < 0.1) {
    return [
      Math.min(255, Math.round(rgb[0] * 1.4)),
      Math.min(255, Math.round(rgb[1] * 1.4)),
      Math.min(255, Math.round(rgb[2] * 1.4)),
    ];
  }

  return rgb;
};

// Функция для определения, является ли цвет ярким желтым
const isBrightYellow = (rgb: number[]) => {
  const [r, g, b] = rgb;
  // Желтый имеет высокие значения красного и зеленого, но низкое значение синего
  return r > 200 && g > 180 && b < 100 && r - b > 150 && g - b > 130;
};

// Функция для смещения желтых цветов в сторону оранжевого
const shiftYellowToOrange = (rgb: number[]) => {
  const [r, g, b] = rgb;
  // Определяем, является ли цвет желтым: высокий красный и зеленый, низкий синий
  if (isBrightYellow(rgb)) {
    // Используем isBrightYellow для определения
    // Смещаем в сторону оранжевого (увеличиваем красный, уменьшаем зеленый)
    const targetR = 177;
    const targetG = 72;
    const targetB = 36;

    // Степень смещения зависит от "желтости" цвета
    const yellowness = Math.min(1, (r + g) / 450);
    const shiftFactor = 0.4 * yellowness; // Максимум 40% смещения

    return [
      Math.round(r * (1 - shiftFactor) + targetR * shiftFactor),
      Math.round(g * (1 - shiftFactor) + targetG * shiftFactor),
      Math.round(b * (1 - shiftFactor) + targetB * shiftFactor),
    ];
  }
  return rgb;
};

// Функция для определения цветов по частям изображения
const getSampledColors = (palette: number[][]) => {
  // Проверка на достаточное количество цветов
  if (!palette || palette.length < 3) {
    // Базовая темная палитра
    return {
      topLeft: [23, 23, 35], // Темно-синий
      topRight: [30, 35, 55], // Синий
      bottomLeft: [15, 20, 45], // Глубокий синий
      bottomRight: [25, 30, 50], // Темно-синий
    };
  }

  // Сортируем палитру по насыщенности
  const sortedByVibrance = [...palette].sort((a, b) => {
    const satA = Math.max(...a) - Math.min(...a);
    const satB = Math.max(...b) - Math.min(...b);
    return satB - satA; // От более насыщенных к менее
  });

  // Сортируем по яркости (темные в начале)
  const sortedByLuminance = [...palette].sort((a, b) => {
    const lumA = getLuminance(a);
    const lumB = getLuminance(b);
    return lumA - lumB;
  });

  // Отделяем красные от не-красных цветов
  const nonReddishColors = palette.filter((color) => !isReddish(color));
  const strongReddishColors = palette.filter((color) =>
    isStronglyReddish(color)
  );

  // Сортируем не-красные цвета по насыщенности
  const sortedNonReddish = [...nonReddishColors].sort((a, b) => {
    const satA = Math.max(...a) - Math.min(...a);
    const satB = Math.max(...b) - Math.min(...b);
    return satB - satA; // От более насыщенных к менее
  });

  // Отдельно выделяем синие оттенки (для правого нижнего угла тоже)
  const blueHues = palette.filter(
    (color) => color[2] > color[0] && color[2] > color[1]
  );

  // Сортируем синие по насыщенности
  const sortedBlueHues = [...blueHues].sort((a, b) => {
    const satA = a[2] - Math.min(a[0], a[1]);
    const satB = b[2] - Math.min(b[0], b[1]);
    return satB - satA;
  });

  // Фильтруем не-красные темные цвета для верхнего левого угла
  const nonReddishDarkColors = sortedByLuminance
    .slice(0, Math.max(3, Math.floor(sortedByLuminance.length / 3)))
    .filter((color) => !isReddish(color));

  // Берем темный цвет для верхнего левого, избегая красных оттенков
  const topLeft =
    nonReddishDarkColors.length > 0 ? nonReddishDarkColors[0] : [40, 40, 40]; // Темно-серый по умолчанию вместо синего

  // Для верхнего правого угла избегаем красных оттенков полностью
  const topRightBase =
    nonReddishDarkColors.length > 1
      ? nonReddishDarkColors[1] // Второй не-красный темный цвет
      : [50, 50, 50]; // Серый по умолчанию вместо синего

  // Смешиваем с верхним левым для лучшего перехода
  const topRight = [
    Math.round((topLeft[0] + topRightBase[0]) / 2),
    Math.round((topLeft[1] + topRightBase[1]) / 2),
    Math.round((topLeft[2] + topRightBase[2]) / 2.2),
  ];

  // Для нижнего левого используем насыщенный оттенок из палитры
  const bottomLeft =
    blueHues.length > 0
      ? sortedBlueHues[0]
      : [
          Math.round(topLeft[0] * 0.8),
          Math.round(topLeft[1] * 0.8),
          Math.round(topLeft[2] * 0.8),
        ]; // Темнее верхнего левого вместо синего

  // Для нижнего правого предпочитаем не-красные насыщенные цвета или синие
  let bottomRight;

  // Проверяем, есть ли в палитре очень сильные красные (явно доминирующие)
  // Они должны составлять значительную часть палитры
  const isRedDominant =
    strongReddishColors.length >= Math.ceil(palette.length * 0.4);

  if (isRedDominant) {
    // Если красные явно доминируют, используем самый насыщенный красный
    bottomRight = strongReddishColors[0];
  } else if (sortedNonReddish.length > 0) {
    // Иначе берем самый насыщенный не-красный
    bottomRight = sortedNonReddish[0];
  } else if (blueHues.length > 0) {
    // Если нет насыщенных не-красных, берем синий
    bottomRight = sortedBlueHues[0];
  } else {
    // Крайний случай - стандартный темно-синий
    bottomRight = [35, 35, 50];
  }

  // Применяем коррекции ко всем цветам
  return {
    topLeft: avoidPaleColors(topLeft),
    topRight: avoidPaleColors(topRight),
    bottomLeft: avoidPaleColors(bottomLeft),
    bottomRight: isBrightYellow(bottomRight)
      ? [120, 77, 13] // Специальный цвет для яркого желтого
      : avoidPaleColors(bottomRight),
  };
};

// --- END HELPER FUNCTIONS ---

interface MovieDetailProps {
  movie: Movie;
  cast: Cast[];
}

interface AnimationRef {
  startTime: number | null;
  startColors: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
  };
}

// Компонент "гнилого помидора" для низкого рейтинга
const RottenTomatoIcon = () => (
  <svg
    aria-hidden="true"
    className="w-4 h-4"
    fill="currentColor"
    height="48"
    viewBox="0 0 52 48"
    width="52"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10.9776 16.4071L30.7147 13.825C29.9339 14.7456 29.3891 15.9951 28.9782 17.2756L8.58308 19.2882C9.18951 18.1109 10.0992 16.986 10.9776 16.4071Z"
      fill="white"
    ></path>
    <path
      d="M28.4027 19.6551L7.73235 21.2908C7.08794 23.2399 6.88835 24.373 6.72913 25.9952L27.6873 25.7423C27.7388 23.9503 27.9815 21.631 28.4027 19.6551Z"
      fill="white"
    ></path>
    <path
      d="M6.72913 28.2058L27.6873 28.4587C27.7388 30.2507 27.9815 32.57 28.4027 34.5459L7.73235 32.9102C7.08794 30.9611 6.88835 29.828 6.72913 28.2058Z"
      fill="white"
    ></path>
    <path
      d="M10.9776 37.794C10.0992 37.2152 9.18951 36.0902 8.58308 34.9129L28.9782 36.9256C29.3891 38.206 29.9339 39.4557 30.7147 40.3761L10.9776 37.794Z"
      fill="white"
    ></path>
    <path
      d="M30.8485 34.6857C31.1189 34.0153 32.0774 33.6069 32.7656 33.6547C33.5012 33.7057 34.2827 34.4797 34.4192 35.241C34.4446 35.2133 34.4711 35.1872 34.4982 35.1615C34.7344 34.9356 35.0303 34.7857 35.3542 34.7444C35.3046 34.5248 35.2928 34.2897 35.3267 34.0485C35.4463 33.1998 36.1267 32.5634 36.9057 32.5697C37.4085 32.5738 37.8495 32.8312 38.1369 33.2267C38.1626 33.1946 38.1909 33.1651 38.2185 33.1351C38.5472 31.4216 38.7555 29.4856 38.8029 27.4311C38.9657 20.3665 37.175 14.5951 34.8033 14.5404C32.4314 14.4856 30.3766 20.1681 30.2138 27.2327C30.2138 27.2327 30.0882 29.8094 30.8485 34.6857Z"
      fill="#00641E"
    ></path>
    <path
      d="M46.9066 42.4113C47.0468 42.1772 47.1251 41.8964 47.1197 41.5981C47.1652 40.6343 46.5042 39.7605 45.5844 39.8573C45.6109 39.747 45.6283 39.6324 45.6351 39.5142C45.6902 38.5487 45.0249 37.7166 44.1491 37.6557C44.1299 37.6545 44.111 37.6539 44.0919 37.6533C44.183 37.4138 44.2282 37.1462 44.2121 36.8628C44.1668 36.0595 43.6133 35.3827 42.8933 35.2495C42.6332 35.2014 42.381 35.2253 42.15 35.3053C41.9318 34.7673 41.4736 34.3682 40.9163 34.2839C40.8722 33.4104 40.2417 32.6913 39.43 32.635C38.9196 32.5996 38.4506 32.8342 38.137 33.227C37.8496 32.8315 37.4085 32.5742 36.9058 32.5701C36.1268 32.5637 35.4464 33.2001 35.3268 34.0489C35.2928 34.29 35.3047 34.525 35.3542 34.7448C35.0304 34.7859 34.7344 34.936 34.4982 35.1617C34.4712 35.1874 34.4446 35.2136 34.4193 35.2412C34.2827 34.48 33.5013 33.7061 32.7657 33.6549C32.0774 33.6071 31.1065 34.0256 30.8485 34.6859C30.9617 35.8374 31.6808 38.9762 34.2818 41.7919L34.3049 41.7936C34.5557 42.0207 34.8832 42.1458 35.2322 42.1147C35.4486 42.0953 35.6479 42.0178 35.8196 41.8982L35.8615 41.9011C36.0903 42.0602 36.3654 42.1434 36.6561 42.1175C36.7671 42.1076 36.8731 42.0809 36.9738 42.0427C37.2229 42.5582 37.7785 42.8914 38.3986 42.8367C38.8788 42.7944 39.287 42.5285 39.5269 42.1543L39.6047 42.1598C39.8443 42.3975 40.1629 42.536 40.5066 42.5257C40.7907 42.9558 41.3125 43.2205 41.8883 43.1699C42.1051 43.1508 42.3076 43.088 42.4881 42.9929C42.7893 43.3638 43.2836 43.5843 43.826 43.5365C44.3622 43.4895 44.8151 43.192 45.0615 42.7805C45.3036 42.9751 45.6069 43.0795 45.9289 43.0508C46.2414 43.0228 46.519 42.8752 46.7276 42.6518L46.7624 42.6542C46.8098 42.5854 46.8504 42.515 46.888 42.4439C46.8889 42.4426 46.8897 42.4411 46.8904 42.4397C46.8955 42.4303 46.9018 42.421 46.9066 42.4113Z"
      fill="#FFD700"
    ></path>
    <path
      clip-rule="evenodd"
      d="M34.2295 12.0576C35.0336 11.9646 35.9722 12.68 37.2798 14.2038C39.587 17.0795 41.097 24.7821 39.6566 32.6704C39.5828 32.6534 39.5074 32.6403 39.43 32.6348C39.0092 32.605 38.5563 32.7622 38.2186 33.1351C38.5473 31.4216 38.7556 29.4856 38.803 27.4311C38.9658 20.3666 37.1751 14.5951 34.8033 14.5403C32.4315 14.4856 30.3767 20.1682 30.2139 27.2327C30.2139 27.2327 30.0883 29.8095 30.8485 34.6857C30.9617 35.8371 31.6808 38.9761 34.2819 41.7917L34.305 41.7933C34.4462 41.9213 34.6123 42.0152 34.7924 42.0688C34.6074 42.1163 34.4196 42.1418 34.2295 42.143C34.1222 42.1356 11.3529 38.9527 11.3529 38.9527C7.74658 38.5854 4.86433 33.3441 4.82861 27.1004C4.86433 20.8565 7.74658 15.6152 11.3529 15.2481C11.3529 15.2481 34.0796 12.0767 34.2295 12.0576ZM28.9782 17.2754L8.58308 19.288C9.18951 18.1107 10.0992 16.9858 10.9776 16.4069L30.7147 13.8248C29.9339 14.7454 29.3891 15.9949 28.9782 17.2754ZM30.7147 40.3759L10.9776 37.7937C10.0992 37.215 9.18951 36.0899 8.58308 34.9128L28.9782 36.9254C29.3891 38.2057 29.9339 39.4554 30.7147 40.3759ZM6.72913 28.2056C6.88835 29.8279 7.08794 30.9609 7.73234 32.91L28.4027 34.5457C27.9815 32.5698 27.7388 30.2505 27.6873 28.4585L6.72913 28.2056ZM7.73234 21.2906L28.4027 19.6549C27.9815 21.6308 27.7388 23.9501 27.6873 25.7422L6.72913 25.995C6.88835 24.3728 7.08794 23.2397 7.73234 21.2906Z"
      fill="#04A53C"
      fill-rule="evenodd"
    ></path>
  </svg>
);

// Компонент для плеера Kinobox
interface KinoboxPlayerProps {
  kpId: string | number;
  onClose: () => void;
}

const KinoboxPlayer = ({ kpId, onClose }: KinoboxPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://kinobox.tv/kinobox.min.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (containerRef.current) {
        (window as any).kbox(containerRef.current, {
          search: { kinopoisk: kpId },
          menu: {
            enabled: false,
          },
          players: {
            turbo: {
              enable: true,
              position: 1,
            },
            alloha: {
              enable: true,
              position: 2,
            },
            videocdn: {
              enable: true,
              position: 3,
            },
          },
        });
      }
    };

    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {}
    };
  }, [kpId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
      <div className="relative w-full max-w-5xl h-[80vh]">
        <button
          className="absolute top-4 right-4 text-white bg-black bg-opacity-50 p-2 rounded-full"
          onClick={onClose}
        >
          <X size={24} />
        </button>
        <div ref={containerRef} className="kinobox_player w-full h-full"></div>
      </div>
    </div>
  );
};

// === НОВЫЙ КОМПОНЕНТ: Уведомление о коллекции ===
interface CollectionNotificationProps {
  movies: Movie[];
  collectionName: string;
  currentMovieId: number; // ID текущего фильма, чтобы не показывать его в уведомлении
  onClose: () => void;
}

const CollectionNotification: React.FC<CollectionNotificationProps> = ({
  movies,
  collectionName,
  currentMovieId,
  onClose,
}) => {
  const router = useRouter();
  const { roundedCorners } = useReleaseQualityVisibility();

  // 1. Создаем карту с оригинальными хронологическими индексами
  const movieIndexMap = useMemo(() => {
    const sortedFullCollection = [...movies].sort((a, b) => {
      if (!a.release_date) return 1;
      if (!b.release_date) return -1;
      return (
        new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
      );
    });
    const indexMap = new Map<number, number>();
    sortedFullCollection.forEach((movie, index) => {
      indexMap.set(movie.id, index + 1); // Сохраняем 1-based индекс
    });
    return indexMap;
  }, [movies]);

  // 2. Фильтруем *после* создания карты индексов
  const collectionMoviesToShow = useMemo(() => {
    // Сортируем еще раз здесь, т.к. порядок может быть важен для отображения,
    // хотя для получения индекса это уже не нужно.
    return movies
      .filter((movie) => movie.id !== currentMovieId)
      .sort((a, b) => {
        if (!a.release_date) return 1;
        if (!b.release_date) return -1;
        return (
          new Date(a.release_date).getTime() -
          new Date(b.release_date).getTime()
        );
      });
  }, [movies, currentMovieId]);

  if (collectionMoviesToShow.length === 0) {
    return null;
  }

  const handleMovieClick = (movieId: number) => {
    playSound("choose.mp3");
    onClose();
    router.push(`/movie/${movieId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-24 right-4 z-[70] w-80 md:w-96 max-w-[calc(100vw-2rem)] bg-yellow-500 rounded-xl shadow-lg border border-black/20 overflow-hidden text-black"
    >
      <div className="p-2 border-b border-black/10 flex justify-between items-center">
        {" "}
        {/* Уменьшен padding, изменен цвет бордера */}
        <div className="flex items-center gap-2">
          {/* Иконка теперь черная */}
          <Film className="w-5 h-5 text-black" />
          {/* Новый заголовок */}
          <h3 className="text-sm font-semibold truncate">А вы смотрели?</h3>
        </div>
        <button
          onClick={onClose}
          // Изменены цвета кнопки
          className="text-black/70 hover:text-black transition-colors p-1 rounded-full hover:bg-black/10"
          aria-label="Закрыть уведомление"
        >
          <X size={16} />
        </button>
      </div>
      <div className="p-2 max-h-60 overflow-y-auto">
        {/* Условный рендеринг: сетка или слайдер */}
        {collectionMoviesToShow.length <= 3 ? (
          // --- СЕТКА для 3 или менее фильмов ---
          <div className="grid grid-cols-3 gap-2">
            {collectionMoviesToShow.map((movie) => (
              <div
                key={movie.id}
                className="cursor-pointer group"
                onClick={() => handleMovieClick(movie.id)}
              >
                <div
                  className={`relative aspect-[2/3] ${
                    roundedCorners ? "rounded-md" : "rounded"
                  } overflow-hidden border-2 border-transparent group-hover:border-white transition-colors duration-200`}
                >
                  <NextImage
                    src={getImageUrl(movie.poster_path || "", "w300")}
                    alt={movie.title || "Постер"}
                    fill
                    sizes="80px"
                    className="object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-1">
                    <p className="text-[10px] text-white font-medium line-clamp-1">
                      {movie.title} ({getYear(movie.release_date)})
                    </p>
                  </div>
                  <div className="absolute top-1 left-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/70 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {movieIndexMap.get(movie.id) ?? "?"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // --- СЛАЙДЕР для более чем 3 фильмов ---
          <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-1">
            {" "}
            {/* Добавлен pb-1 для тени */}
            {collectionMoviesToShow.map((movie) => (
              // Задаем ширину и flex-none для элемента слайдера
              <div
                key={movie.id}
                className="cursor-pointer group flex-none w-20" // Ширина элемента слайдера
                onClick={() => handleMovieClick(movie.id)}
              >
                <div
                  className={`relative aspect-[2/3] ${
                    roundedCorners ? "rounded-md" : "rounded"
                  } overflow-hidden border-2 border-transparent group-hover:border-white transition-colors duration-200`}
                >
                  <NextImage
                    src={getImageUrl(movie.poster_path || "", "w300")}
                    alt={movie.title || "Постер"}
                    fill
                    sizes="80px" // Размер остается прежним
                    className="object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                  {/* Оверлей с названием и номером */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-1">
                    {/* Номер фильма вверху */}
                    <div className="self-start bg-black/70 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                      {movieIndexMap.get(movie.id) ?? "?"}
                    </div>
                    {/* Название фильма внизу */}
                    <p className="text-[10px] text-white font-medium line-clamp-1">
                      {movie.title} ({getYear(movie.release_date)})
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
// === КОНЕЦ КОМПОНЕНТА УВЕДОМЛЕНИЯ ===

// === НОВЫЙ КОМПОНЕНТ: САЙДБАР С ИНФОРМАЦИЕЙ ===
interface MovieInfoSidebarProps {
  movie: Movie;
  isOpen: boolean;
  onClose: () => void;
  logoPath: string | null; // Добавляем logoPath
  loadingLogo: boolean; // Добавляем loadingLogo
}

const MovieInfoSidebar: React.FC<MovieInfoSidebarProps> = ({
  movie,
  isOpen,
  onClose,
  logoPath, // Получаем пропс
  loadingLogo, // Получаем пропс
}) => {
  if (!isOpen) return null;

  // Функция для форматирования валюты
  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      {/* Оверлей для закрытия */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[60]" // z-index ниже сайдбара
        onClick={onClose}
      />
      {/* Сайдбар */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-gradient-to-b from-gray-900 to-black shadow-xl z-[65] flex flex-col border-l border-white/10"
      >
        <div className="flex-shrink-0 p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">
            Информация о фильме
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-4 md:p-6 text-sm">
          {/* === БЛОК С ЛОГОТИПОМ (Выравнивание по левому краю, уменьшен размер) === */}
          {(loadingLogo || logoPath) && (
            // Убираем justify-center, уменьшаем min-h
            <div className="mb-4 flex items-center min-h-[40px]">
              {loadingLogo ? (
                <div className="w-5 h-5 border-2 border-gray-600 border-t-yellow-400 rounded-full animate-spin"></div>
              ) : logoPath ? (
                <img
                  src={getImageUrl(logoPath, "w300")}
                  alt={`${movie.title} logo`}
                  className="max-h-10 object-contain" // Уменьшаем max-h до 10 (40px)
                  style={{ filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.4))" }}
                />
              ) : null}
            </div>
          )}
          {/* === КОНЕЦ БЛОКА С ЛОГОТИПОМ === */}

          {/* Содержимое взято из старых блоков */}
          <div className="space-y-4">
            {(movie as any).original_title &&
              (movie as any).original_title !== movie.title && (
                <div>
                  <span className="block text-gray-400 mb-1">
                    Оригинальное название
                  </span>
                  <span className="text-white">
                    {(movie as any).original_title}
                  </span>
                </div>
              )}
            {movie.release_date && (
              <div>
                <span className="block text-gray-400 mb-1">Дата выхода</span>
                <span className="text-white">
                  {new Date(movie.release_date).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            {(movie as any).status && (
              <div>
                <span className="block text-gray-400 mb-1">Статус</span>
                <span className="text-white">
                  {(movie as any).status === "Released"
                    ? "Выпущен"
                    : (movie as any).status === "In Production"
                    ? "В производстве"
                    : (movie as any).status === "Post Production"
                    ? "Пост-продакшн"
                    : (movie as any).status === "Planned"
                    ? "Запланирован"
                    : (movie as any).status}
                </span>
              </div>
            )}
            {(movie as any).runtime > 0 && (
              <div>
                <span className="block text-gray-400 mb-1">
                  Продолжительность
                </span>
                <span className="text-white">
                  {Math.floor((movie as any).runtime / 60)}ч{" "}
                  {(movie as any).runtime % 60}
                  мин
                </span>
              </div>
            )}
            {movie.genres && movie.genres.length > 0 && (
              <div>
                <span className="block text-gray-400 mb-1">Жанры</span>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                  {movie.genres.map((genre) => (
                    <span key={genre.id} className="py-1 text-white">
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(movie as any).budget > 0 && (
              <div>
                <span className="block text-gray-400 mb-1">Бюджет</span>
                <span className="text-white">
                  {formatCurrency((movie as any).budget)}
                </span>
              </div>
            )}
            {(movie as any).revenue > 0 && (
              <div>
                <span className="block text-gray-400 mb-1">Сборы</span>
                <span className="text-white">
                  {formatCurrency((movie as any).revenue)}
                </span>
              </div>
            )}
            {(movie as any).spoken_languages &&
              (movie as any).spoken_languages.length > 0 && (
                <div>
                  <span className="block text-gray-400 mb-1">Языки</span>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                    {(movie as any).spoken_languages.map((language: any) => (
                      <span key={language.iso_639_1} className="text-white">
                        {language.name || language.english_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            {(movie as any).production_companies &&
              (movie as any).production_companies.length > 0 && (
                <div>
                  <span className="block text-gray-400 mb-1">Производство</span>
                  <p className="text-white leading-relaxed">
                    {(movie as any).production_companies
                      .map((company: any) => company.name)
                      .join(", ")}
                  </p>
                </div>
              )}
            {(movie as any).production_countries &&
              (movie as any).production_countries.length > 0 && (
                <div>
                  <span className="block text-gray-400 mb-1">Страна</span>
                  <p className="text-white leading-relaxed">
                    {(movie as any).production_countries
                      .map((country: any) => country.name)
                      .join(", ")}
                  </p>
                </div>
              )}
          </div>
        </div>
      </motion.div>
    </>
  );
};
// === КОНЕЦ КОМПОНЕНТА САЙДБАРА ===

export default function MovieDetail({ movie, cast }: MovieDetailProps) {
  const {
    setMovieColors,
    resetToBaseColors,
    colors: contextColors,
  } = useColorContext();

  // Начинаем с базовых цветов
  const [colorVariations, setColorVariations] = useState({
    topLeft: "var(--color-ultrablur-tl)",
    topRight: "var(--color-ultrablur-tr)",
    bottomLeft: "var(--color-ultrablur-bl)",
    bottomRight: "var(--color-ultrablur-br)",
  });

  // Устанавливаем заголовок страницы (title) равным названию фильма
  useEffect(() => {
    if (movie?.title) {
      document.title = `${movie.title} — Фильм`;
    } else {
      document.title = "Детали фильма";
    }

    // Восстанавливаем прежний заголовок при размонтировании компонента
    return () => {
      document.title = "watchlist";
    };
  }, [movie?.title]);

  // Хранение целевых цветов для плавной анимации
  const targetColorsRef = useRef<{
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
  }>({
    topLeft: "rgba(23, 23, 23, 0.32)",
    topRight: "rgba(28, 28, 28, 0.1)",
    bottomLeft: "rgba(39, 39, 39, 0.89)",
    bottomRight: "rgba(65, 65, 65, 0.7)",
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const animationRef = useRef<AnimationRef | null>(null);

  // Устанавливаем isPageLoaded сразу в true, чтобы избежать затемнения
  const [isPageLoaded, setIsPageLoaded] = useState(true);

  // Устанавливаем isComponentLoaded сразу в true, чтобы избежать затемнения
  const [isComponentLoaded, setIsComponentLoaded] = useState(true);

  // Добавляем состояние для уведомления
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
    visible: boolean;
  }>({
    message: "",
    type: "success",
    visible: false,
  });

  // Добавляем логику проверки избранного
  const { isInWatchlist: checkWatchlistStatus, isInitialized } = useWatchlist();
  const isMovieInWatchlist = checkWatchlistStatus(movie.id);

  // Переименуем локальное состояние
  const [isInWatchlistLocal, setIsInWatchlistLocal] = useState(false);

  // Добавим функцию для прямой проверки статуса в localStorage
  const checkWatchlistStatusDirectly = (movieId: number): boolean => {
    if (typeof window === "undefined") return false;

    try {
      const watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
      return watchlist.some((item: any) => item.id === movieId);
    } catch (e) {
      console.error("Ошибка при прямой проверке статуса в медиатеке:", e);
      return false;
    }
  };

  // Обновляем эффект синхронизации со списком избранного
  useEffect(() => {
    // Функция проверки статуса, которая использует прямую проверку
    const checkStatus = () => {
      if (movie?.id) {
        // Проверяем напрямую в localStorage
        const status = checkWatchlistStatusDirectly(movie.id);
        setIsInWatchlistLocal(status);
      }
    };

    // Первоначальная проверка
    checkStatus();

    // Добавляем слушатели событий
    const handleWatchlistChange = () => {
      checkStatus();
    };

    // Проверяем регулярно (для надежности)
    const interval = setInterval(checkStatus, 1000);

    document.addEventListener("watchlistChange", handleWatchlistChange);
    window.addEventListener("storage", handleWatchlistChange);

    return () => {
      document.removeEventListener("watchlistChange", handleWatchlistChange);
      window.removeEventListener("storage", handleWatchlistChange);
      clearInterval(interval);
    };
  }, [movie?.id]); // Убираем checkWatchlistStatus из зависимостей, так как используем прямую проверку

  // Функция для интерполяции между двумя цветами RGBA
  const interpolateColor = (
    startColor: string | null,
    endColor: string | null,
    progress: number
  ): string => {
    // Возвращаем всегда строку (или базовый цвет)
    const fallbackColor = startColor || "rgba(128, 128, 128, 0.7)"; // Запасной цвет
    if (!startColor || !endColor) return fallbackColor;

    try {
      // Парсинг начального цвета
      let startR_str: string | undefined,
        startG_str: string | undefined,
        startB_str: string | undefined,
        startA_str: string | undefined = "1";
      if (startColor.startsWith("var(")) {
        const computedStyle = getComputedStyle(document.documentElement);
        const varName = startColor.substring(4, startColor.length - 1);
        const computedColor = computedStyle.getPropertyValue(varName).trim();
        const rgbMatch = computedColor.match(
          /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/
        );
        if (rgbMatch) {
          [, startR_str, startG_str, startB_str, startA_str = "1"] = rgbMatch;
        } else {
          return fallbackColor; // Если не удалось распарсить CSS переменную
        }
      } else {
        const rgbMatch = startColor.match(
          /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/
        );
        if (rgbMatch) {
          [, startR_str, startG_str, startB_str, startA_str = "1"] = rgbMatch;
        } else {
          return fallbackColor; // Если не удалось распарсить цвет
        }
      }

      // Парсинг конечного цвета
      const endMatch = endColor.match(
        /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/
      );
      if (!endMatch) return fallbackColor;

      const [, endR_str, endG_str, endB_str, endA_str = "1"] = endMatch;

      // Проверяем что все строки распарсились
      if (
        !startR_str ||
        !startG_str ||
        !startB_str ||
        !startA_str ||
        !endR_str ||
        !endG_str ||
        !endB_str ||
        !endA_str
      ) {
        return fallbackColor;
      }

      // Интерполяция компонентов цвета
      const r = Math.round(
        parseFloat(startR_str) +
          (parseFloat(endR_str) - parseFloat(startR_str)) * progress
      );
      const g = Math.round(
        parseFloat(startG_str) +
          (parseFloat(endG_str) - parseFloat(startG_str)) * progress
      );
      const b = Math.round(
        parseFloat(startB_str) +
          (parseFloat(endB_str) - parseFloat(startB_str)) * progress
      );
      const a =
        parseFloat(startA_str) +
        (parseFloat(endA_str) - parseFloat(startA_str)) * progress;

      return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
    } catch (e) {
      console.error("Ошибка интерполяции цвета:", e);
      return fallbackColor;
    }
  };

  // Функция анимации с исправленной проверкой на null
  const animateColors = (timestamp: number) => {
    // Проверяем, существует ли animationRef.current
    if (!animationRef.current) {
      return;
    }

    // Проверяем, существуют ли целевые цвета
    if (
      !targetColorsRef.current.topLeft ||
      !targetColorsRef.current.topRight ||
      !targetColorsRef.current.bottomLeft ||
      !targetColorsRef.current.bottomRight
    ) {
      animationRef.current = null;
      return;
    }

    if (!animationRef.current.startTime) {
      animationRef.current.startTime = timestamp;
    }

    const elapsed = timestamp - animationRef.current.startTime;
    const duration = 3000; // 3 секунды
    let progress = Math.min(elapsed / duration, 1);
    progress =
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    // Интерполируем каждый компонент цвета
    const newColors = {
      topLeft: interpolateColor(
        animationRef.current.startColors.topLeft,
        targetColorsRef.current.topLeft, // Убедились, что не null выше
        progress
      ),
      topRight: interpolateColor(
        animationRef.current.startColors.topRight,
        targetColorsRef.current.topRight, // Убедились, что не null выше
        progress
      ),
      bottomLeft: interpolateColor(
        animationRef.current.startColors.bottomLeft,
        targetColorsRef.current.bottomLeft, // Убедились, что не null выше
        progress
      ),
      bottomRight: interpolateColor(
        animationRef.current.startColors.bottomRight,
        targetColorsRef.current.bottomRight, // Убедились, что не null выше
        progress
      ),
    };

    // Обновляем состояние цветов
    setColorVariations(newColors); // newColors теперь всегда { topLeft: string, ...}

    // Продолжаем анимацию, пока progress < 1
    if (progress < 1) {
      requestAnimationFrame(animateColors);
    } else {
      // Когда анимация завершена, обновляем контекст
      // Убеждаемся, что targetColorsRef.current содержит строки перед вызовом
      if (
        targetColorsRef.current.topLeft &&
        targetColorsRef.current.topRight &&
        targetColorsRef.current.bottomLeft &&
        targetColorsRef.current.bottomRight
      ) {
        // Убрали явное приведение типа, так как проверка выше гарантирует, что все поля - строки
        setMovieColors(targetColorsRef.current);
      }
      animationRef.current = null;
    }
  };

  // Очистка цветов при выходе со страницы
  useEffect(() => {
    return () => {
      resetToBaseColors();
      // Прекращаем любые анимации при размонтировании
      if (animationRef.current) {
        animationRef.current = null;
      }
    };
  }, [resetToBaseColors]);

  // Добавляем задержку перед началом извлечения цветов
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (movie.poster_path) {
        try {
          // Используем наш API-прокси вместо прямого обращения к серверу изображений
          const originalImageUrl = `https://imagetmdb.com/t/p/w500${movie.poster_path}`;
          const proxyImageUrl = `/api/proxy-image?url=${encodeURIComponent(
            originalImageUrl
          )}`;
          const img = new window.Image();

          img.onload = () => {
            try {
              // Проверяем, что изображение полностью загружено
              if (!img.complete || img.naturalWidth === 0) {
                console.error("Изображение не полностью загружено");
                return;
              }

              const colorThief = new ColorThief();
              const palette = colorThief.getPalette(img, 8); // Увеличиваем палитру до 8 цветов для лучшего анализа

              if (palette && palette.length >= 4) {
                // Function to determine color group (moved outside for clarity)
                const getColorGroup = (rgb: number[]) => {
                  const [r, g, b] = rgb;
                  // Определяем доминантный канал - улучшенное определение синего
                  if (r > g && r > b && r > 60) return "red";
                  if (g > r && g > b && g > 60) return "green";
                  // Менее строгое условие для синего для лучшего его определения
                  if (b > r * 0.8 && b > g * 0.8 && b > 50) return "blue";

                  // Определяем смешанные цвета
                  if (r > 60 && g > 60 && r > b && g > b) return "yellow";
                  if (r > 60 && b > 60 && r > g && b > g) return "magenta";
                  if (g > 60 && b > 60 && g > r && b > r) return "cyan";

                  // Серый диапазон
                  const maxDiff = Math.max(
                    Math.abs(r - g),
                    Math.abs(r - b),
                    Math.abs(g - b)
                  );

                  if (maxDiff < 20) {
                    // Различаем темный серый и светлый серый
                    const localLuminance = getLuminance(rgb); // Use the outer getLuminance
                    if (localLuminance < 80) return "darkGray";
                    return "lightGray";
                  }

                  // Прочие цвета
                  return "other";
                };

                // Функция для определения, является ли цвет серым (moved outside)
                const isGrayish = (rgb: number[]) => {
                  const colorGroup = getColorGroup(rgb);
                  return (
                    colorGroup === "darkGray" || colorGroup === "lightGray"
                  );
                };

                // Функция для смягчения слишком ярких цветов (moved outside)
                const softenColor = (rgb: number[]) => {
                  const [r, g, b] = rgb;
                  // Если цвет близок к белому, смягчаем его
                  if (r > 200 && g > 200 && b > 200) {
                    return [
                      Math.max(120, r - 60),
                      Math.max(120, g - 60),
                      Math.max(120, b - 60),
                    ];
                  }
                  return rgb;
                };

                // Function to reduce weak red tones (moved outside)
                const reduceWeakRed = (rgb: number[]) => {
                  const [r, g, b] = rgb;

                  // Если красный не сильно доминирует над другими каналами
                  if (r > g && r > b && r < g * 1.5 && r < b * 1.8) {
                    // Снижаем красный и усиливаем другие каналы
                    const redDominance = Math.min(
                      (r - Math.max(g, b)) / r,
                      0.5
                    );

                    // Если красный доминирует слабо, повышаем другие каналы
                    if (redDominance < 0.3) {
                      // Находим второй по величине канал
                      if (g > b) {
                        // Усиливаем зеленый
                        return [
                          Math.max(0, r - 15),
                          Math.min(255, g + 25),
                          Math.max(0, b),
                        ];
                      } else {
                        // Усиливаем синий
                        return [
                          Math.max(0, r - 15),
                          Math.max(0, g),
                          Math.min(255, b + 30),
                        ];
                      }
                    }
                  }
                  return rgb;
                };

                // Function to reduce overall red dominance (moved outside)
                const reduceRedDominance = (rgb: number[]) => {
                  // Если красный канал значительно больше других - это может быть проблемой
                  if (rgb[0] > rgb[1] * 1.4 && rgb[0] > rgb[2] * 1.4) {
                    // Уменьшаем красный канал и балансируем цвета
                    return [
                      Math.round(rgb[0] * 0.7), // Снижаем красный
                      Math.round(rgb[1] * 1.1), // Немного увеличиваем зеленый
                      Math.round(rgb[2] * 1.2), // Больше увеличиваем синий для баланса
                    ];
                  }
                  return rgb;
                };

                // Функция для определения "чистоты" цвета (насколько он близок к чисто белому или чисто черному)
                const getColorPurity = (rgb: number[]) => {
                  const [r, g, b] = rgb;
                  // Проверяем близость к белому (все каналы > 240)
                  const isNearWhite = r > 240 && g > 240 && b > 240;
                  // Проверяем близость к черному (все каналы < 30)
                  const isNearBlack = r < 30 && g < 30 && b < 30;
                  // Возвращаем оценку "чистоты" (0 - чистый цвет, 1 - белый/черный)
                  return isNearWhite || isNearBlack ? 1 : 0;
                };

                // Функция для определения насыщенности цвета
                const getSaturation = (rgb: number[]) => {
                  const [r, g, b] = rgb;
                  const max = Math.max(r, g, b);
                  const min = Math.min(r, g, b);
                  // Если яркость 0, то насыщенность тоже 0
                  if (max === 0) return 0;
                  return (max - min) / max;
                };

                // Функция для гармонизации цветов (сделать их более согласованными)
                const harmonizeColors = (colors: number[][]) => {
                  const [topLeft, topRight, bottomLeft, bottomRight] = colors;
                  // Special case: if top colors are strongly reddish, adjust bottom colors automatically
                  if (
                    isStronglyReddish(topLeft) &&
                    isStronglyReddish(topRight)
                  ) {
                    // Автоматически корректируем нижние цвета, чтобы они контрастировали с верхними
                    const adjustedBottomLeft = [
                      Math.max(30, bottomLeft[0] * 0.7),
                      Math.max(50, bottomLeft[1] * 1.2),
                      Math.max(80, bottomLeft[2] * 1.3),
                    ];
                    const adjustedBottomRight = [
                      Math.max(30, bottomRight[0] * 0.7),
                      Math.max(50, bottomRight[1] * 1.2),
                      Math.max(80, bottomRight[2] * 1.3),
                    ];
                    return [
                      topLeft,
                      topRight,
                      adjustedBottomLeft,
                      adjustedBottomRight,
                    ];
                  }
                  if (colors.length <= 1) return colors;

                  // Находим средние значения RGB
                  const avgR =
                    colors.reduce((sum, color) => sum + color[0], 0) /
                    colors.length;
                  const avgG =
                    colors.reduce((sum, color) => sum + color[1], 0) /
                    colors.length;
                  const avgB =
                    colors.reduce((sum, color) => sum + color[2], 0) /
                    colors.length;

                  // Смещаем каждый цвет немного в сторону среднего (на 15%)
                  return colors.map((color) => [
                    Math.round(color[0] * 0.85 + avgR * 0.15),
                    Math.round(color[1] * 0.85 + avgG * 0.15),
                    Math.round(color[2] * 0.85 + avgB * 0.15),
                  ]);
                };

                // Функция для создания монохромной гаммы на основе одного цвета
                const createMonochromaticPalette = (baseColor: number[]) => {
                  const [r, g, b] = baseColor;
                  const colorGroup = getColorGroup(baseColor);

                  // Находим доминантный канал
                  const dominantChannel =
                    r >= g && r >= b ? 0 : g >= r && g >= b ? 1 : 2;

                  // Создаем темную вариацию (для нижнего левого угла)
                  let darker = [
                    Math.max(0, r - 40),
                    Math.max(0, g - 40),
                    Math.max(0, b - 40),
                  ];

                  // Создаем светлую вариацию (для верхнего правого угла)
                  let lighter = [
                    Math.min(255, r + 30),
                    Math.min(255, g + 30),
                    Math.min(255, b + 30),
                  ];

                  // Создаем вариацию с акцентом на основе цветовой группы
                  let accent;

                  switch (colorGroup) {
                    case "red":
                    case "magenta":
                      // Усиливаем красный, слегка уменьшаем остальные
                      accent = [
                        Math.min(255, r + 20),
                        Math.max(0, g - 10),
                        Math.max(0, b - 5),
                      ];
                      break;
                    case "green":
                    case "yellow":
                      // Усиливаем зеленый, слегка уменьшаем остальные
                      accent = [
                        Math.max(0, r - 5),
                        Math.min(255, g + 20),
                        Math.max(0, b - 10),
                      ];
                      break;
                    case "blue":
                    case "cyan":
                      // Усиливаем синий, сильнее уменьшаем красный и зеленый для большей насыщенности
                      accent = [
                        Math.max(0, r - 20),
                        Math.max(0, g - 15),
                        Math.min(255, b + 35),
                      ];
                      break;
                    case "darkGray":
                    case "lightGray":
                      // Для серых создаем легкий холодный оттенок (синий)
                      accent = [
                        Math.max(0, r - 15),
                        Math.max(0, g - 5),
                        Math.min(255, b + 25),
                      ];
                      break;
                    default:
                      // Усиливаем доминантный канал
                      accent = [...baseColor];
                      accent[dominantChannel] = Math.min(
                        255,
                        accent[dominantChannel] + 25
                      );
                  }

                  // Гармонизируем цвета
                  const harmonized = harmonizeColors([
                    baseColor,
                    darker,
                    lighter,
                    accent,
                  ]);

                  // Применяем снижение влияния слабых красных для topLeft и bottomRight
                  const adjustedTopLeft = reduceWeakRed(harmonized[0]);
                  const adjustedBottomRight = reduceWeakRed(harmonized[3]);

                  return {
                    base: harmonized[0],
                    darker: harmonized[1],
                    lighter: harmonized[2],
                    accent: harmonized[3],
                  };
                };

                // Сортируем палитру по насыщенности, исключая слишком темные и светлые
                const sortedPalette = [...palette]
                  .filter((color) => {
                    // Исключаем слишком темные цвета (яркость < 30)
                    const localLuminance = getLuminance(color); // Use outer getLuminance
                    return localLuminance > 30 && localLuminance < 240;
                  })
                  .map((color) => ({
                    color,
                    saturation: getSaturation(color),
                    purity: getColorPurity(color),
                    luminance: getLuminance(color), // Use outer getLuminance
                  }))
                  .sort((a, b) => {
                    // Баланс между насыщенностью и яркостью
                    // Предпочитаем цвета со средней яркостью и хорошей насыщенностью
                    const aScore =
                      a.saturation * 0.7 +
                      (1 - Math.abs(a.luminance - 128) / 128) * 0.3;
                    const bScore =
                      b.saturation * 0.7 +
                      (1 - Math.abs(b.luminance - 128) / 128) * 0.3;
                    return bScore - aScore;
                  })
                  .map((item) => item.color);

                // Если палитра пустая из-за фильтрации, используем исходную
                const finalPalette =
                  sortedPalette.length > 0 ? sortedPalette : palette;

                // Определяем, является ли основная гамма серой
                const primaryColor = shiftYellowToOrange(
                  softenColor(finalPalette[0] || [128, 128, 128])
                );
                const isGrayPalette = isGrayish(primaryColor);

                let newColors;

                // Используем новую функцию для получения более точных цветов из разных частей постера
                const sampledColors = getSampledColors(finalPalette);

                // Создаем градиенты с правильной прозрачностью на основе цветов постера
                newColors = {
                  topLeft: `rgba(${sampledColors.topLeft[0]}, ${sampledColors.topLeft[1]}, ${sampledColors.topLeft[2]}, 0.32)`,
                  topRight: `rgba(${sampledColors.topRight[0]}, ${sampledColors.topRight[1]}, ${sampledColors.topRight[2]}, 0.90)`,
                  bottomLeft: `rgba(${sampledColors.bottomLeft[0]}, ${sampledColors.bottomLeft[1]}, ${sampledColors.bottomLeft[2]}, 0.90)`,
                  bottomRight: isBrightYellow(sampledColors.bottomRight)
                    ? `rgb(120 77 13 / 95%)` // Используем указанный цвет с прозрачностью 95%
                    : `rgba(${sampledColors.bottomRight[0]}, ${sampledColors.bottomRight[1]}, ${sampledColors.bottomRight[2]}, 0.95)`,
                };

                // Запускаем плавную анимацию к новым цветам
                startColorAnimation(newColors);
              } else {
                // Запасной вариант, если палитра не получена
                const dominantColor = colorThief.getColor(img);
                if (dominantColor && dominantColor.length === 3) {
                  // Функция для смягчения слишком ярких цветов (use outer helper)
                  const softenColorLocal = (rgb: number[]) => {
                    const [r, g, b] = rgb;
                    if (r > 200 && g > 200 && b > 200) {
                      return [
                        Math.max(120, r - 60),
                        Math.max(120, g - 60),
                        Math.max(120, b - 60),
                      ];
                    }
                    return rgb;
                  };

                  // Смягчаем доминирующий цвет
                  const softDominant = shiftYellowToOrange(
                    softenColorLocal(dominantColor)
                  );

                  // Проверяем, является ли доминирующий цвет серым (use outer helper)
                  const isGrayishLocal = (rgb: number[]) => {
                    const [r, g, b] = rgb;
                    const maxDiff = Math.max(
                      Math.abs(r - g),
                      Math.abs(r - b),
                      Math.abs(g - b)
                    );
                    return maxDiff < 20;
                  };

                  const isGrayDominant = isGrayishLocal(softDominant);

                  let newColors;

                  if (isGrayDominant) {
                    // Для серых постеров создаем искусственную палитру
                    const [r, g, b] = softDominant;
                    const grayPalette = [
                      softDominant,
                      [
                        Math.max(0, r - 30),
                        Math.max(0, g - 30),
                        Math.max(0, b - 30),
                      ],
                      [
                        Math.min(255, r + 30),
                        Math.min(255, g + 30),
                        Math.min(255, b + 30),
                      ],
                      [
                        Math.max(0, r - 10),
                        Math.max(0, g - 5),
                        Math.min(255, b + 25),
                      ],
                    ];
                    const sampledColors = getSampledColors(grayPalette); // Use outer helper
                    newColors = {
                      topLeft: `rgba(${sampledColors.topLeft[0]}, ${sampledColors.topLeft[1]}, ${sampledColors.topLeft[2]}, 0.32)`,
                      topRight: `rgba(${sampledColors.topRight[0]}, ${sampledColors.topRight[1]}, ${sampledColors.topRight[2]}, 0.90)`,
                      bottomLeft: `rgba(${sampledColors.bottomLeft[0]}, ${sampledColors.bottomLeft[1]}, ${sampledColors.bottomLeft[2]}, 0.90)`,
                      bottomRight: isBrightYellow(sampledColors.bottomRight) // Use outer helper
                        ? `rgb(120 77 13 / 95%)`
                        : `rgba(${sampledColors.bottomRight[0]}, ${sampledColors.bottomRight[1]}, ${sampledColors.bottomRight[2]}, 0.95)`,
                    };
                  } else {
                    // Для не-серых изображений создаем разнообразную палитру
                    const [r, g, b] = softDominant;
                    const colorPalette = [
                      softDominant,
                      [
                        Math.max(0, r - 40),
                        Math.max(0, g - 40),
                        Math.max(0, b - 40),
                      ],
                      [
                        Math.min(255, r + 30),
                        Math.min(255, g + 30),
                        Math.min(255, b + 30),
                      ],
                      r >= g && r >= b
                        ? [
                            Math.min(255, r + 20),
                            Math.max(0, g - 10),
                            Math.max(0, b - 10),
                          ]
                        : g >= r && g >= b
                        ? [
                            Math.max(0, r - 10),
                            Math.min(255, g + 20),
                            Math.max(0, b - 10),
                          ]
                        : [
                            Math.max(0, r - 10),
                            Math.max(0, g - 10),
                            Math.min(255, b + 20),
                          ],
                    ];
                    const sampledColors = getSampledColors(colorPalette); // Use outer helper
                    newColors = {
                      topLeft: `rgba(${sampledColors.topLeft[0]}, ${sampledColors.topLeft[1]}, ${sampledColors.topLeft[2]}, 0.32)`,
                      topRight: `rgba(${sampledColors.topRight[0]}, ${sampledColors.topRight[1]}, ${sampledColors.topRight[2]}, 0.90)`,
                      bottomLeft: `rgba(${sampledColors.bottomLeft[0]}, ${sampledColors.bottomLeft[1]}, ${sampledColors.bottomLeft[2]}, 0.90)`,
                      bottomRight: isBrightYellow(sampledColors.bottomRight) // Use outer helper
                        ? `rgb(120 77 13 / 95%)`
                        : `rgba(${sampledColors.bottomRight[0]}, ${sampledColors.bottomRight[1]}, ${sampledColors.bottomRight[2]}, 0.95)`,
                    };
                  }

                  // Запускаем плавную анимацию к новым цветам
                  startColorAnimation(newColors);
                }
              }
            } catch (error) {
              console.error("Ошибка при извлечении цвета:", error);
            }
          };

          img.onerror = (e) => {
            console.error("Ошибка загрузки изображения:", e);
          };

          // Установка src должна быть после обработчиков
          img.src = proxyImageUrl;
        } catch (error) {
          console.error("Общая ошибка:", error);
        }
      }
    }, 500); // Увеличил задержку до 500мс для лучшего визуального эффекта

    return () => clearTimeout(timeout);
  }, [movie.poster_path, setMovieColors]); // Removed startColorAnimation dependency

  // Удаляем эффект, который добавляет блокирующие стили
  useEffect(() => {
    // Удаляем класс loading после загрузки страницы
    document.body.classList.remove("loading");
  }, []);

  // Оптимизируем стартовую функцию анимации
  const startColorAnimation = (targetColors: {
    // targetColors теперь всегда строки
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
  }) => {
    // Сохраняем целевые цвета (теперь можно без приведения типа)
    targetColorsRef.current = targetColors;

    // Если анимация уже запущена, сохраняем её текущее состояние
    if (!animationRef.current) {
      // Инициализируем если отсутствует
      animationRef.current = {
        startTime: null,
        startColors: {
          topLeft: "rgba(23, 23, 23, 0.32)",
          topRight: "rgba(28, 28, 28, 0.1)", // Возвращаем базовый темный цвет
          bottomLeft: "rgba(39, 39, 39, 0.89)",
          bottomRight: "rgba(65, 65, 65, 0.7)", // Возвращаем базовый темный цвет
        },
      };
    }

    // Запускаем анимацию
    requestAnimationFrame(animateColors);
  };

  // Подготавливаем стили контейнера
  const containerStyle = {
    "--color-ub-tl": colorVariations.topLeft,
    "--color-ub-tr": colorVariations.topRight,
    "--color-ub-bl": colorVariations.bottomLeft,
    "--color-ub-br": colorVariations.bottomRight,
    "--color-surface-background-100": "#121212",
    "--transition-duration": "1.5s",
    // Устанавливаем начальную непрозрачность в 1, чтобы избежать затемнения
    opacity: 1,
    // Можно убрать transition для opacity, чтобы избежать эффекта затемнения
    // transition: "opacity 0.5s ease-in-out",
  } as React.CSSProperties;

  // Добавьте в начало компонента
  useEffect(() => {
    // Добавляем проверку на существование массива cast
    if (!cast || !Array.isArray(cast)) {
      console.warn("Данные об актёрском составе отсутствуют или некорректны");
      return;
    }

    // Проверяем дублирующиеся ID в списке актеров
    const castIds = cast.map((person) => person.id);
    const duplicateCastIds = castIds.filter(
      (id, index) => castIds.indexOf(id) !== index
    );

    if (duplicateCastIds.length > 0) {
      console.warn(
        "Найдены дублирующиеся ID в списке актеров:",
        duplicateCastIds
      );
    }

    // Проверяем дублирующиеся ID в жанрах
    if (movie.genres) {
      const genreIds = movie.genres.map((genre) => genre.id);
      const duplicateGenreIds = genreIds.filter(
        (id, index) => genreIds.indexOf(id) !== index
      );

      if (duplicateGenreIds.length > 0) {
        console.warn("Дублирующиеся ID в списке жанров:", duplicateGenreIds);
      }
    }
  }, [cast, movie.genres]);

  // Функция для отображения уведомления
  const showPosterNotification = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    setNotification({
      message,
      type,
      visible: true,
    });

    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Передаем функцию в компонент WatchlistButtonWrapper
  const handleWatchlistAction = (action: "add" | "remove", title: string) => {
    if (action === "add") {
      showPosterNotification("Добавлено в избранное", "success");
    } else {
      showPosterNotification("Удалено из избранного", "info");
    }
  };

  // Определяем стили для уведомления
  const getNotificationStyles = () => {
    switch (notification.type) {
      case "success":
        return {
          icon: <Check className="w-5 h-5" />,
          bgColor: "bg-green-500",
          textColor: "text-white",
        };
      case "error":
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          bgColor: "bg-red-500",
          textColor: "text-white",
        };
      case "info":
      default:
        return {
          icon: <Check className="w-5 h-5" />,
          bgColor: "bg-yellow-500",
          textColor: "text-black",
        };
    }
  };

  const notificationStyles = getNotificationStyles();

  // Добавляем хук для работы с историей просмотров
  const { addToHistory } = useViewingHistory();

  // В существующий useEffect или создаем новый
  useEffect(() => {
    // Добавляем фильм в историю просмотров только один раз при загрузке страницы фильма
    addToHistory({
      id: movie.id,
      title: movie.title || "Фильм без названия", // Используем fallback
      poster_path: movie.poster_path || "", // Используем fallback
      backdrop_path: movie.backdrop_path || "", // Используем fallback
      release_date: movie.release_date || "", // Используем fallback
      vote_average: movie.vote_average || 0, // Используем fallback
      overview: movie.overview || "", // Используем fallback
    });
  }, [movie.id, addToHistory]); // Указываем только ID фильма и функцию, а не весь объект movie

  // Добавляем функцию извлечения режиссёра перед return
  const getDirector = () => {
    if (
      !(movie as any).credits ||
      !(movie as any).credits.crew ||
      !Array.isArray((movie as any).credits.crew)
    ) {
      return "Неизвестно";
    }

    const directors = (movie as any).credits.crew.filter(
      (crewMember: { job: string; name: string }) =>
        crewMember.job === "Director"
    );

    if (directors.length === 0) {
      return "Неизвестно";
    }

    return directors
      .map((director: { name: string }) => director.name)
      .join(", ");
  };

  // Добавляем состояние для хранения рекомендуемых фильмов
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Добавляем состояние для хранения похожих фильмов
  const [similarMovies, setSimilarMovies] = useState<any[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // Добавляем состояние для хранения рецензий
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);

  // Добавляем состояния для хранения предыдущих значений
  const [prevCastCount, setPrevCastCount] = useState(0);
  const [prevTrailersCount, setPrevTrailersCount] = useState(0);
  const [prevRecommendationsCount, setPrevRecommendationsCount] = useState(0);
  const [prevSimilarMoviesCount, setPrevSimilarMoviesCount] = useState(0);
  const [prevReviewsCount, setPrevReviewsCount] = useState(0);

  // Обновляем эффект для обработки актерского состава
  useEffect(() => {
    // Сначала устанавливаем состояние загрузки
    setLoadingCast(true);

    // Если есть данные, сохраняем предыдущее значение счетчика
    if (cast && cast.length > 0) {
      setPrevCastCount(cast.length);
    }

    // Имитируем задержку загрузки для консистентности с другими табами
    setTimeout(() => {
      setLoadingCast(false);
    }, 500);
  }, [cast]);

  // Добавим стейты для обсуждений с сайта кинобобер
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [selectedDiscussion, setSelectedDiscussion] =
    useState<Discussion | null>(null);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);

  // Используем хук для получения обсуждений
  const {
    discussions: fetchedDiscussions,
    isLoading: isLoadingDiscussions,
    error: discussionsError,
  } = useDiscussions(movie?.id || null);

  // Выносим функцию загрузки рецензий в отдельную функцию для возможности повторного использования
  const fetchLatestReviews = useCallback(async () => {
    if (!movie || !movie.id) return;

    setLoadingReviews(true);
    try {
      // Получаем рецензии на русском
      const resRu = await fetch(
        `https://apitmdb.kurwa-bober.ninja/3/movie/${movie.id}/reviews?api_key=4ef0d7355d9ffb5151e987764708ce96&language=ru-RU`
      );
      const dataRu = await resRu.json();
      const ruReviews = dataRu.results || [];

      // Получаем рецензии на английском
      const resEn = await fetch(
        `https://apitmdb.kurwa-bober.ninja/3/movie/${movie.id}/reviews?api_key=4ef0d7355d9ffb5151e987764708ce96&language=en-US`
      );
      const dataEn = await resEn.json();
      const enReviews = dataEn.results || [];

      // Преобразуем обсуждения в формат рецензий
      const discussionReviews = discussions.map((discussion) => ({
        id: `discussion_${discussion.id}`,
        author: discussion.email,
        content: discussion.comment,
        created_at: new Date(discussion.published).toISOString(),
        language: "ru",
        author_details: {
          avatar_path: null,
          rating: null,
        },
        updated_at: new Date(discussion.published).toISOString(),
        url: "",
        isDiscussion: true, // Помечаем, что это обсуждение из курва-бобер
        likes: discussion.liked,
        original: discussion, // Сохраняем оригинальный объект для доступа к его свойствам
      }));

      // Объединяем рецензии
      const allReviews = [
        ...discussionReviews, // Добавляем обсуждения в начало
        ...ruReviews.map((review: any) => ({ ...review, language: "ru" })),
        ...enReviews.map((review: any) => ({ ...review, language: "en" })),
      ];

      // Удаляем дубликаты по id
      const uniqueReviews = allReviews.filter(
        (review: any, index: number, self: any[]) =>
          index === self.findIndex((r: any) => r.id === review.id)
      );

      // Сортируем: сначала русские из курва-бобер, потом русские, потом английские
      const sortedReviews = uniqueReviews.sort((a: any, b: any) => {
        // Сначала отображаем обсуждения из курва-бобер
        if (a.isDiscussion && !b.isDiscussion) return -1;
        if (!a.isDiscussion && b.isDiscussion) return 1;
        // Затем приоритезируем русский язык
        if (a.language === "ru" && b.language === "en") return -1;
        if (a.language === "en" && b.language === "ru") return 1;
        // Если языки одинаковые, сортируем по дате (новые сначала)
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

      setReviews(sortedReviews);
      console.log("Объединенные рецензии:", sortedReviews.length);
      setPrevReviewsCount(sortedReviews.length);
    } catch (error) {
      console.error("Ошибка при загрузке рецензий:", error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [movie, discussions]);

  // Обновляем стейт обсуждений при изменении данных из хука
  useEffect(() => {
    setLoadingDiscussions(isLoadingDiscussions);
    if (fetchedDiscussions) {
      setDiscussions(fetchedDiscussions);
      // После получения новых обсуждений перезагружаем рецензии
      console.log(
        "Получены новые обсуждения, обновляем рецензии:",
        fetchedDiscussions.length
      );
    }
  }, [fetchedDiscussions, isLoadingDiscussions]);

  // Обновляем рецензии при изменении списка обсуждений
  useEffect(() => {
    if (discussions.length > 0) {
      console.log(
        "Обновляем рецензии после получения обсуждений:",
        discussions.length
      );
      fetchLatestReviews();
    }
  }, [discussions, fetchLatestReviews]);

  // Функция для получения рецензий к фильму при изменении фильма
  useEffect(() => {
    fetchLatestReviews();
  }, [movie, fetchLatestReviews]); // Обновляем рецензии при изменении фильма или функции загрузки

  // Обновляем эффект для загрузки рекомендаций
  useEffect(() => {
    async function fetchRecommendations() {
      if (!movie.id) return;

      try {
        setLoadingRecommendations(true);

        // Используем существующую функцию для получения рекомендаций
        const data = await getMovieRecommendations(movie.id.toString());
        setRecommendations(data.results || []);

        // Сохраняем новое значение счетчика
        if (data.results && data.results.length > 0) {
          setPrevRecommendationsCount(data.results.length);
        }
      } catch (error) {
        console.error("Ошибка при загрузке рекомендаций:", error);
      } finally {
        setLoadingRecommendations(false);
      }
    }

    fetchRecommendations();
  }, [movie.id]);

  // Добавляем функцию для загрузки похожих фильмов
  useEffect(() => {
    async function fetchSimilarMovies() {
      if (!movie.id) return;

      try {
        setLoadingSimilar(true);

        // Используем функцию для получения похожих фильмов
        const data = await getMovieSimilar(movie.id.toString());
        setSimilarMovies(data.results || []);
      } catch (error) {
        console.error("Ошибка при загрузке похожих фильмов:", error);
      } finally {
        setLoadingSimilar(false);
      }
    }

    fetchSimilarMovies();
  }, [movie.id]);

  // Добавляем состояние для трейлеров
  const [trailers, setTrailers] = useState<any[]>([]);
  const [loadingTrailers, setLoadingTrailers] = useState(false);

  // Загрузка трейлеров при монтировании компонента
  useEffect(() => {
    async function fetchTrailers() {
      if (!movie.id) return;

      try {
        setLoadingTrailers(true);
        const videos = await getMovieVideos(movie.id.toString());
        // Получаем все видео с типом Trailer, не ограничиваясь языком
        const movieTrailers = videos.filter(
          (video) => video.type === "Trailer"
        );
        setTrailers(movieTrailers);
      } catch (error) {
        console.error("Ошибка при загрузке трейлеров:", error);
      } finally {
        setLoadingTrailers(false);
      }
    }

    fetchTrailers();
  }, [movie.id]);

  // Добавляем состояние для выбранного трейлера
  const [selectedTrailer, setSelectedTrailer] = useState<any>(null);

  // Функция для воспроизведения трейлера
  const playTrailer = (trailer: any) => {
    setSelectedTrailer(trailer);
  };

  // Функция для закрытия модального окна
  const closeTrailer = () => {
    setSelectedTrailer(null);
  };

  // Добавляем в компонент MovieDetail состояние для отслеживания открытия плеера
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  // Добавляем состояние для отслеживания открытия iframe
  const [isIframeOpen, setIsIframeOpen] = useState(false);
  // Состояние для хранения URL iframe
  const [iframeUrl, setIframeUrl] = useState("");

  // Улучшенная функция для открытия плеера с проверкой
  const openPlayer = () => {
    // Сначала воспроизводим звук при клике для мгновенной обратной связи
    playSound("choose.mp3");

    // Открываем плеер (изменим на другое действие или просто показываем сообщение)
    // setIsPlayerOpen(true); - удаляем это
    showPosterNotification("Функция плеера временно отключена", "info");

    // Добавляем фильм в историю просмотров
    addToHistory({
      id: movie.id,
      title: movie.title || "Фильм без названия",
      poster_path: movie.poster_path || "", // Добавляем || ""
      backdrop_path: movie.backdrop_path || "", // Добавляем || ""
      release_date: movie.release_date || "",
      vote_average: movie.vote_average || 0,
      overview: movie.overview || "",
    });
  };

  // Функция для закрытия плеера
  const closePlayer = () => {
    setIsPlayerOpen(false);
  };

  // Добавим состояние для уведомления об ошибке
  const [iframeError, setIframeError] = useState<string | null>(null);
  // Добавим состояние для индикации загрузки iframe
  const [isLoadingIframe, setIsLoadingIframe] = useState(false);

  // Добавим состояние для отображения индикатора загрузки на SVG иконке
  const [iframeButtonLoading, setIframeButtonLoading] = useState(false);
  // Добавим состояние для управления поповером с переводами
  const [isTranslationPopoverOpen, setIsTranslationPopoverOpen] =
    useState(false);
  // Добавим состояние для хранения вариантов переводов
  const [translations, setTranslations] = useState<any[]>([]);
  // Добавим состояние для хранения выбранного перевода
  const [selectedTranslation, setSelectedTranslation] = useState<string | null>(
    null
  );

  // Добавляем состояние для загрузки для актерского состава
  const [loadingCast, setLoadingCast] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingCast(false);
    }, 500);
  }, [cast]);

  // Добавляем состояние для хранения изображений фильма
  const [movieImages, setMovieImages] = useState<any[]>([]);
  const [moviePosters, setMoviePosters] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [loadingPosters, setLoadingPosters] = useState(false);
  const [prevImagesCount, setPrevImagesCount] = useState(0);
  const [prevPostersCount, setPrevPostersCount] = useState(0);

  // Добавляем функцию для загрузки изображений фильма
  useEffect(() => {
    async function fetchMovieImages() {
      if (!movie.id) return;

      try {
        setLoadingImages(true);
        setLoadingPosters(true);

        // Используем функцию для получения изображений фильма
        const data = await getMovieImages(movie.id.toString());

        // Отбираем backdrop изображения
        const backdrops = data.backdrops || [];
        setMovieImages(backdrops);

        // Отбираем poster изображения
        const posters = data.posters || [];
        setMoviePosters(posters);

        // Сохраняем новое значение счетчика для backdrops
        if (backdrops.length > 0) {
          setPrevImagesCount(backdrops.length);
        }

        // Сохраняем новое значение счетчика для posters
        if (posters.length > 0) {
          setPrevPostersCount(posters.length);
        }
      } catch (error) {
        console.error("Ошибка при загрузке изображений:", error);
      } finally {
        setLoadingImages(false);
        setLoadingPosters(false);
      }
    }

    fetchMovieImages();
  }, [movie.id]);

  // Добавляем состояния для модального окна изображений
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState("");

  // Добавляем функцию для открытия модального окна с изображением
  const openImageModal = (imagePath: string) => {
    setCurrentImage(getImageUrl(imagePath, "original"));
    setIsImageModalOpen(true);

    // Можно добавить звуковой эффект при открытии изображения
    playSound("choose.mp3");
  };

  // Добавляем функцию для закрытия модального окна
  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };

  // Добавляем обработчик клавиши Escape для закрытия модального окна
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isImageModalOpen) {
        closeImageModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isImageModalOpen]);

  // Добавляем состояния для коллекции
  const [collectionMovies, setCollectionMovies] = useState<any[]>([]);
  const [loadingCollection, setLoadingCollection] = useState(false);
  const [prevCollectionMoviesCount, setPrevCollectionMoviesCount] = useState(0);
  const [collectionInfo, setCollectionInfo] = useState<any>(null);
  const [showCollectionNotification, setShowCollectionNotification] =
    useState(false); // Состояние для уведомления о коллекции
  const collectionNotificationTimerRef = useRef<NodeJS.Timeout | null>(null); // Ref для таймера

  // Добавляем эффект для загрузки коллекции
  useEffect(() => {
    async function fetchCollection() {
      // Очищаем предыдущий таймер, если он есть
      if (collectionNotificationTimerRef.current) {
        clearTimeout(collectionNotificationTimerRef.current);
        collectionNotificationTimerRef.current = null;
        setShowCollectionNotification(false); // Скрываем уведомление при смене фильма
      }

      if (!(movie as any).belongs_to_collection?.id) {
        setShowCollectionNotification(false); // Убедимся, что уведомление скрыто, если коллекции нет
        setCollectionMovies([]); // Очищаем коллекцию
        setCollectionInfo(null); // Очищаем инфо о коллекции
        return;
      }

      try {
        setLoadingCollection(true);
        const collectionId = (movie as any).belongs_to_collection.id.toString();

        // Используем функцию для получения данных о коллекции
        const data = await getMovieCollection(collectionId);

        // Сортируем фильмы по дате релиза и исключаем текущий фильм
        const sortedMovies = data.parts
          ? [...data.parts]
              // Убираем фильтрацию текущего фильма здесь, сделаем это в компоненте уведомления
              .sort((a, b) => {
                if (!a.release_date) return 1;
                if (!b.release_date) return -1;
                return (
                  new Date(a.release_date).getTime() -
                  new Date(b.release_date).getTime()
                );
              })
          : [];

        setCollectionMovies(sortedMovies);
        setCollectionInfo({
          name: data.name,
          overview: data.overview,
          backdrop_path: data.backdrop_path,
          poster_path: data.poster_path,
        });

        if (sortedMovies.length > 1) {
          // Показываем уведомление только если в коллекции больше одного фильма
          setPrevCollectionMoviesCount(sortedMovies.length);
          // Показываем уведомление с задержкой в 3 секунды
          collectionNotificationTimerRef.current = setTimeout(() => {
            setShowCollectionNotification(true);
          }, 3000); // 3 секунды задержки
        } else {
          setShowCollectionNotification(false); // Скрываем, если фильмов мало
        }
      } catch (error) {
        console.error("Ошибка при загрузке коллекции:", error);
        setShowCollectionNotification(false); // Скрываем в случае ошибки
      } finally {
        setLoadingCollection(false);
      }
    }

    fetchCollection();

    // Очистка таймера при размонтировании компонента или смене фильма
    return () => {
      if (collectionNotificationTimerRef.current) {
        clearTimeout(collectionNotificationTimerRef.current);
      }
    };
  }, [movie]); // Перезапускаем эффект при смене фильма

  // Добавляем новое состояние для хранения сертификации
  const [certification, setCertification] = useState<string>("N/A");
  const [loadingCertification, setLoadingCertification] =
    useState<boolean>(false);

  // Добавляем эффект для загрузки данных о сертификации
  useEffect(() => {
    async function fetchCertification() {
      if (!movie.id) return;

      try {
        setLoadingCertification(true);
        const cert = await getMovieCertification(movie.id.toString());
        setCertification(cert);
      } catch (error) {
        console.error("Ошибка при загрузке сертификации:", error);
      } finally {
        setLoadingCertification(false);
      }
    }

    fetchCertification();
  }, [movie.id]);

  // Добавляем состояние для логотипа фильма
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [loadingLogo, setLoadingLogo] = useState<boolean>(false);

  // Добавляем эффект для загрузки логотипа
  useEffect(() => {
    async function fetchLogo() {
      if (!movie.id) return;
      setLoadingLogo(true);
      try {
        const data = await getMovieLogos(movie.id);
        // Выбираем предпочтительно русский, затем английский логотип
        const preferredLogo =
          data.logos?.find((logo: any) => logo.iso_639_1 === "ru") ||
          data.logos?.find((logo: any) => logo.iso_639_1 === "en");
        // Удаляем fallback на первый попавшийся логотип: || data.logos?.[0];

        if (preferredLogo) {
          setLogoPath(preferredLogo.file_path);
        } else {
          setLogoPath(null); // Убедимся, что лого нет, если не нашли подходящий
        }
      } catch (error) {
        console.error("Ошибка при загрузке логотипа:", error);
        setLogoPath(null); // Устанавливаем null в случае ошибки
      } finally {
        setLoadingLogo(false);
      }
    }

    fetchLogo();
  }, [movie.id]);

  // Добавьте эту функцию после других функций-обработчиков,
  // но перед return компонента
  const handleRecommendationClick =
    (movieId: number) => (e: React.MouseEvent) => {
      // Воспроизводим звук при клике
      playSound("choose.mp3");

      // Заменяем window.location.href на router.push для предотвращения полной перезагрузки
      router.push(`/movie/${movieId}`);
    };

  // Добавляем функцию для определения цвета фона сертификации
  const getCertificationStyle = (cert: string) => {
    if (!cert || cert === "N/A") return "bg-gray-700/50 text-gray-300";

    const age = parseInt(cert);

    if (isNaN(age)) return "bg-gray-700/50 text-gray-300";

    if (age >= 18) return "bg-red-700/70 text-white";
    if (age >= 16) return "bg-orange-700/70 text-white";
    if (age >= 12) return "bg-yellow-700/70 text-white";
    if (age >= 6) return "bg-green-700/70 text-white";
    return "bg-blue-700/70 text-white";
  };

  const router = useRouter();

  // Получаем настройку закругленных углов из контекста
  const { roundedCorners } = useReleaseQualityVisibility();

  // Добавляем функцию для загрузки качества фильма
  const [movieQuality, setMovieQuality] = useState<string | null>(null);
  const [loadingQuality, setLoadingQuality] = useState(false);

  // Добавляем состояния для рейтингов
  const [imdbRating, setImdbRating] = useState<string | null>(null);
  const [kpRating, setKpRating] = useState<string | null>(null);
  const [loadingRatings, setLoadingRatings] = useState(false);

  // Добавляем состояние для хранения URL iframe из API
  const [apiIframeUrl, setApiIframeUrl] = useState<string | null>(null);

  // Добавляем эффект для загрузки данных о качестве
  useEffect(() => {
    async function fetchMovieQuality() {
      if (!movie.id) return;

      try {
        setLoadingQuality(true);

        // Получаем год из даты релиза
        const year = movie.release_date ? movie.release_date.split("-")[0] : "";

        // Используем оригинальное название фильма или обычное название
        // Приоритет для original_title
        const title = (movie as any).original_title || movie.title || "";

        // Кодируем название для URL, обеспечиваем правильное кодирование
        const encodedTitle = encodeURIComponent(title);

        // Используем URL только с названием и годом
        const url = `https://api.alloha.tv/?token=3a4e69a3bb3a0eb3b5bf5eba7e563b&name=${encodedTitle}&year=${year}`;

        console.log("Запрос качества фильма:", url);

        const response = await fetch(url);
        const data = await response.json();

        console.log("Ответ API качества:", data);

        if (data.status === "success" && data.data) {
          if (data.data.quality) {
            console.log("Установлено качество:", data.data.quality);
            setMovieQuality(data.data.quality);

            // Сохраняем рейтинги, если они есть в ответе
            if (data.data.rating_imdb) {
              setImdbRating(data.data.rating_imdb.toString());
            }
            if (data.data.rating_kp) {
              setKpRating(data.data.rating_kp.toString());
            }
          }

          // Сохраняем URL iframe, если он есть в ответе
          if (data.data.iframe) {
            console.log("Получен iframe URL:", data.data.iframe);
            setApiIframeUrl(data.data.iframe);
          }
        } else {
          console.log("Качество не найдено в ответе API");

          // Дополнительная попытка с использованием разных параметров
          // Попробуем искать только по названию без года
          const fallbackUrl = `https://api.alloha.tv/?token=3a4e69a3bb3a0eb3b5bf5eba7e563b&name=${encodedTitle}`;
          console.log("Попытка запроса без года:", fallbackUrl);

          const fallbackResponse = await fetch(fallbackUrl);
          const fallbackData = await fallbackResponse.json();

          console.log("Ответ запроса без года:", fallbackData);

          if (fallbackData.status === "success" && fallbackData.data) {
            if (fallbackData.data.quality) {
              console.log(
                "Установлено качество из запроса без года:",
                fallbackData.data.quality
              );
              setMovieQuality(fallbackData.data.quality);

              // Сохраняем рейтинги из запроса без года, если они есть
              if (fallbackData.data.rating_imdb) {
                setImdbRating(fallbackData.data.rating_imdb.toString());
              }
              if (fallbackData.data.rating_kp) {
                setKpRating(fallbackData.data.rating_kp.toString());
              }
            }

            // Сохраняем URL iframe из второго запроса, если он есть
            if (fallbackData.data.iframe) {
              console.log(
                "Получен iframe URL из запроса без года:",
                fallbackData.data.iframe
              );
              setApiIframeUrl(fallbackData.data.iframe);
            }
          }
        }
      } catch (error) {
        console.error("Ошибка при загрузке качества фильма:", error);
      } finally {
        setLoadingQuality(false);
      }
    }

    fetchMovieQuality();
  }, [movie.id, movie.title, movie.release_date]);

  // Добавляем ref для поповера
  const translationPopoverRef = useRef<HTMLDivElement>(null);

  // Добавляем useEffect для обработки клика вне поповера
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        translationPopoverRef.current &&
        !translationPopoverRef.current.contains(event.target as Node) &&
        isTranslationPopoverOpen
      ) {
        setIsTranslationPopoverOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTranslationPopoverOpen]);

  // Добавляем состояние для отслеживания загрузки логотипа
  // Удаляем дублирующее объявление
  // const [loadingLogo, setLoadingLogo] = useState(true);

  // Используем новый хук
  const { kinoboxId, isLoading: isLoadingKinobox } = useKinobox(movie);

  // Выводим идентификатор в консоль для отладки
  useEffect(() => {
    console.log("kinoboxID из хука:", kinoboxId);
  }, [kinoboxId]);

  // Добавляем состояние для Kinobox плеера
  const [isKinoboxOpen, setIsKinoboxOpen] = useState(false);

  // Функция открытия Kinobox плеера
  const openKinoboxPlayer = () => {
    playSound("click.mp3");

    // Проверяем есть ли kinoboxId
    if (kinoboxId) {
      // Если есть - открываем обычный плеер kinobox
      setIsKinoboxOpen(true);
    } else {
      // Проверяем, есть ли ответ API качества с iframe
      const apiResponse = getApiQualityResponse();
      if (apiResponse?.data?.iframe) {
        // Если есть iframe в ответе API качества - используем его
        setIframeUrl(apiResponse.data.iframe);
        setIsIframeOpen(true);
      } else {
        // Если ничего нет - показываем уведомление
        showPosterNotification("Просмотр фильма недоступен", "info");
        playSound("error.mp3");
      }
    }
  };

  // Функция для получения данных из ответа API качества
  const getApiQualityResponse = () => {
    try {
      // Используем сохраненный URL из API, если он есть
      if (apiIframeUrl) {
        return {
          status: "success",
          data: {
            quality: movieQuality,
            iframe: apiIframeUrl,
          },
        };
      } else if (movieQuality) {
        // Если URL нет, но есть качество, используем стандартный URL для качества
        return {
          status: "success",
          data: {
            quality: movieQuality,
            iframe: `https://api.alloha.tv/iframe?token=3a4e69a3bb3a0eb3b5bf5eba7e563b&kp=${movie.id}`,
          },
        };
      }
      return null;
    } catch (error) {
      console.error("Ошибка при получении данных API качества:", error);
      return null;
    }
  };

  // Функция закрытия Kinobox плеера
  const closeKinoboxPlayer = () => {
    setIsKinoboxOpen(false);
  };

  // Функция для предзагрузки URL iframe и получения доступных переводов
  const preloadIframeUrl = async () => {
    // Функция удалена, возвращаем false
    return false;
  };

  // Функция для открытия поповера с переводами
  const openTranslationPopover = async () => {
    // Просто показываем уведомление, что функция просмотра недоступна
    showPosterNotification("Просмотр фильмов временно недоступен", "info");
    playSound("error.mp3");
  };

  // Функция выбора перевода
  const selectTranslation = (translationId: string) => {
    // Функция-заглушка
  };

  // Компонент TranslationPopover
  const TranslationPopover = () => {
    return null;
  };

  // Функция для открытия iframe
  const openIframe = async () => {
    const apiResponse = getApiQualityResponse();
    if (apiResponse?.data?.iframe) {
      setIframeUrl(apiResponse.data.iframe);
      setIsIframeOpen(true);

      // Добавляем фильм в историю просмотров
      addToHistory({
        id: movie.id,
        title: movie.title || "Фильм без названия", // Используем fallback
        poster_path: movie.poster_path || "", // Используем fallback
        backdrop_path: movie.backdrop_path || "", // Используем fallback
        release_date: movie.release_date || "", // Используем fallback
        vote_average: movie.vote_average || 0, // Используем fallback
        overview: movie.overview || "", // Используем fallback
      });
    } else {
      showPosterNotification("Просмотр фильмов временно недоступен", "info");
      playSound("error.mp3");
    }
  };

  // Функция для закрытия iframe
  const closeIframe = () => {
    setIsIframeOpen(false);
    setIframeUrl("");
  };

  // Компонент IframePlayer
  const IframePlayer = ({
    url,
    onClose,
  }: {
    url: string;
    onClose: () => void;
  }) => {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
        <div className="relative w-full max-w-5xl h-[80vh]">
          <button
            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 p-2 rounded-full"
            onClick={onClose}
          >
            <X size={24} />
          </button>
          <iframe
            src={url}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            referrerPolicy="origin"
            sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"
          ></iframe>
        </div>
      </div>
    );
  };

  const [currentBackdropIndex, setCurrentBackdropIndex] = useState(0);
  const [currentBackdropPath, setCurrentBackdropPath] = useState<string | null>(
    movie.backdrop_path
  );

  // Состояние для настройки динамической смены фона
  const [isDynamicBackdropEnabled, setIsDynamicBackdropEnabled] =
    useState(false);

  // Загрузка настройки динамической смены фона
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedSetting = localStorage.getItem("settings_dynamic_backdrop");
        setIsDynamicBackdropEnabled(savedSetting === "true");
      } catch (error) {
        console.error("Ошибка при чтении настроек:", error);
      }
    }
  }, []);

  // Обработчик изменения настроек
  useEffect(() => {
    const handleSettingsChange = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.dynamicBackdrop !== "undefined") {
        setIsDynamicBackdropEnabled(event.detail.dynamicBackdrop);
      }
    };

    document.addEventListener(
      "settingsChange",
      handleSettingsChange as EventListener
    );
    return () => {
      document.removeEventListener(
        "settingsChange",
        handleSettingsChange as EventListener
      );
    };
  }, []);

  // Эффект для ротации фоновых изображений каждые 10 секунд
  useEffect(() => {
    // Если есть дополнительные изображения и их больше одного И функция динамической смены включена
    if (movieImages && movieImages.length > 1 && isDynamicBackdropEnabled) {
      // Устанавливаем таймер смены изображения каждые 10 секунд
      const timer = setInterval(() => {
        // Вычисляем следующий индекс (с возвратом к началу)
        const nextIndex = (currentBackdropIndex + 1) % movieImages.length;
        setCurrentBackdropIndex(nextIndex);
        setCurrentBackdropPath(movieImages[nextIndex].file_path);
      }, 10000);

      // Очищаем таймер при размонтировании компонента
      return () => clearInterval(timer);
    }
  }, [movieImages, currentBackdropIndex, isDynamicBackdropEnabled]);

  const {
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    markAsWatched,
    markAsUnwatched,
    isWatched,
  } = useWatchlist();

  // Добавляем состояние для отключения цветных градиентов
  const [disableColorOverlay, setDisableColorOverlay] = useState(() => {
    // Проверяем сохраненную настройку, по умолчанию отключено
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("settings_disable_color_overlay");
        return saved ? saved === "true" : false;
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  // Слушаем события изменения настроек
  useEffect(() => {
    const handleSettingsChange = (event: CustomEvent) => {
      if (event.detail && event.detail.disableColorOverlay !== undefined) {
        setDisableColorOverlay(event.detail.disableColorOverlay);
      }
      // ... обработка других настроек ...
    };

    document.addEventListener(
      "settingsChange",
      handleSettingsChange as EventListener
    );
    return () => {
      document.removeEventListener(
        "settingsChange",
        handleSettingsChange as EventListener
      );
    };
  }, []);

  // Добавляем состояние и эффект для затемнения фона на мобильных при скролле
  const [scrollOpacity, setScrollOpacity] = useState(0);
  const animationFrameIdRef = useRef<number | null>(null); // Ref для ID requestAnimationFrame

  useEffect(() => {
    const handleScroll = () => {
      // Отменяем предыдущий запланированный кадр, если есть
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }

      // Планируем обновление прозрачности на следующий кадр анимации
      animationFrameIdRef.current = requestAnimationFrame(() => {
        // Затемняем на первых 30% высоты вьюпорта
        const opacity = Math.min(
          1,
          window.scrollY / (window.innerHeight * 0.3)
        );
        setScrollOpacity(opacity);
      });
    };

    // Добавляем слушатель только если ширина окна меньше md (768px)
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    const addListener = () => {
      if (mediaQuery.matches) {
        window.addEventListener("scroll", handleScroll);
        handleScroll(); // Устанавливаем начальное значение
      }
    };

    const removeListener = () => {
      window.removeEventListener("scroll", handleScroll);
    };

    // Проверяем медиа-запрос и добавляем/удаляем слушатель
    addListener();
    mediaQuery.addEventListener("change", (e) => {
      if (e.matches) {
        addListener();
      } else {
        removeListener();
        setScrollOpacity(0); // Сбрасываем прозрачность на десктопе
      }
    });

    // Очистка слушателя и requestAnimationFrame при размонтировании
    return () => {
      removeListener();
      mediaQuery.removeEventListener("change", addListener);
      // Отменяем последний запланированный кадр при очистке
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Состояние для сайдбара
  const [showActorNotification, setShowActorNotification] = useState(false);
  // Новое состояние, чтобы отследить, было ли уведомление уже показано хотя бы раз
  const [actorNotificationTriggered, setActorNotificationTriggered] =
    useState(false);

  const topActors = useMemo(() => {
    if (Array.isArray(cast)) {
      // Берем первых 8 актеров
      return cast.slice(0, 8);
    }
    return [];
  }, [cast]);

  // useEffect для слушателя прокрутки
  useEffect(() => {
    const handleScroll = () => {
      // Показываем только если прокрутка > 100px И уведомление еще НЕ БЫЛО показано ни разу
      if (window.scrollY > 100 && !actorNotificationTriggered) {
        setShowActorNotification(true);
        setActorNotificationTriggered(true); // Отмечаем, что условие выполнилось
        // Больше не удаляем слушатель здесь, он будет удален при размонтировании
      }
    };

    // Добавляем слушатель только если уведомление еще не было триггернуто
    if (!actorNotificationTriggered) {
      window.addEventListener("scroll", handleScroll, { passive: true });
    }

    // Очистка слушателя при размонтировании компонента ИЛИ когда уведомление было показано
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
    // Зависимость теперь от actorNotificationTriggered, чтобы удалить слушатель, когда оно станет true
  }, [actorNotificationTriggered]);

  return (
    <>
      {/* Убираем полноэкранный индикатор загрузки, чтобы он не перекрывал хедер */}
      {!isComponentLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-40">
          <div className="w-10 h-10 border-4 border-gray-600 border-t-yellow-400 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Основной контейнер - меняем visibility на display для лучшей плавности */}
      <div
        className="relative min-h-screen movie-detail-container"
        style={{
          ...containerStyle,
          display: isComponentLoaded ? "block" : "block", // Всегда отображаем
        }}
      >
        {/* Фоновое изображение фильма - расположено вверху справа с увеличенной высотой (СКРЫТО НА МОБИЛЬНЫХ) */}
        {(currentBackdropPath || movie.backdrop_path) && (
          <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none hidden md:block">
            {" "}
            {/* z-0 чтобы быть ПОД хедером (z-60) */}
            {/* Контейнер с фоновым изображением в стиле Luma/Plex */}
            <div
              className="absolute top-0 right-[0px] w-[80vw] h-screen" // Устанавливаем top-0 и h-screen
              style={{
                // zIndex: -1, // Убираем z-index отсюда
                opacity: 0.6,
                maskImage: `linear-gradient(to left, rgba(0,0,0,0.9) 50%, rgba(0,0,0,0) 100%), 
                           linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 40%),
                           linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 10%)`,
                WebkitMaskImage: `linear-gradient(to left, rgba(0,0,0,0.9) 50%, rgba(0,0,0,0) 100%), 
                                 linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 40%),
                                 linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 10%)`,
                maskComposite: "intersect",
                WebkitMaskComposite: "source-in",
              }}
            >
              <NextImage
                key={currentBackdropPath || movie.backdrop_path}
                src={getImageUrl(
                  currentBackdropPath || movie.backdrop_path || "", // Добавляем || ""
                  "original"
                )}
                alt={movie.title || "Фон фильма"}
                fill
                priority
                className="object-cover object-right"
                sizes="60vw"
                style={{
                  filter: "contrast(1.1) brightness(0.8)",
                  position: "absolute",
                  height: "100%",
                  width: "100%",
                  inset: 0,
                  transition: "opacity 1s ease-in-out",
                }}
              />
            </div>
          </div>
        )}

        {/* Градиентный фон с улучшенным переходом и отключенными событиями */}
        <div
          className="fixed inset-0 z-1 movie-detail-overlay pointer-events-none"
          style={{
            backgroundImage: disableColorOverlay
              ? `radial-gradient(circle farthest-side at top left, rgb(34 77 96 / 0%), transparent 75%), 
                  radial-gradient(circle farthest-side at top right, rgb(42 64 66 / 0%), transparent 70%), 
                  radial-gradient(circle farthest-side at bottom right, rgb(34 77 96 / 0%), transparent 90%), 
                  radial-gradient(circle farthest-side at bottom left, rgb(34 77 96 / 0%), transparent 75%)`
              : `radial-gradient(circle farthest-side at top left, var(--color-ub-tl), transparent 75%), 
                  radial-gradient(circle farthest-side at top right, var(--color-ub-tr), transparent 70%), 
                  radial-gradient(circle farthest-side at bottom right, var(--color-ub-br), transparent 90%), 
                  radial-gradient(circle farthest-side at bottom left, var(--color-ub-bl), transparent 75%)`,
            backgroundColor: "rgba(18, 18, 18, 0.15)",
            transition: `all var(--transition-duration) cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
        ></div>

        {/* Содержимое контейнера должно быть поверх фонового градиента */}
        {/* relative z-10 container mx-auto px-4 pt-32 pb-8 */}
        <motion.div
          className="relative z-10 w-full mx-auto px-4 md:px-10 pt-[50vh] md:pt-32 pb-8" // Изменен padding-top для мобильных: pt-[50vh]
          initial={false}
        >
          {/* Добавляем кнопку "Назад" в основной контент, если нужно */}
          <button
            onClick={() => router.back()}
            className="hidden md:flex items-center gap-2 text-white hover:text-yellow-400 transition-colors mb-4" // Добавлено hidden md:flex
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Назад</span>
          </button>

          <div className="flex flex-col md:flex-row gap-8">
            {/* === ФОНОВОЕ ИЗОБРАЖЕНИЕ ДЛЯ МОБИЛЬНЫХ === */}
            {(currentBackdropPath || movie.backdrop_path) && (
              <div className="block md:hidden fixed inset-x-0 top-0 z-0 pointer-events-none">
                {" "}
                {/* Изменено: fixed, inset-x-0, top-0, z-0, убраны отступы */}
                <div
                  className="relative w-full h-[60vh] overflow-hidden" // Изменено: увеличена высота до 60vh
                  style={{
                    // Изменено: маска для затемнения снизу
                    maskImage: `linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 95%)`,
                    WebkitMaskImage: `linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 95%)`,
                  }}
                >
                  <NextImage
                    key={currentBackdropPath || movie.backdrop_path}
                    src={getImageUrl(
                      currentBackdropPath || movie.backdrop_path || "", // Добавляем || ""
                      "w1280" // Используем больший размер для мобильных
                    )}
                    alt={movie.title || "Фон фильма"}
                    fill
                    priority
                    className="object-cover"
                    sizes="100vw"
                    style={{
                      filter: "contrast(1.1) brightness(0.8)",
                      position: "absolute",
                      height: "100%",
                      width: "100%",
                      inset: 0,
                      transition: "opacity 1s ease-in-out",
                    }}
                  />
                  {/* Затемняющий оверлей для мобильных при скролле */}
                  <div
                    className="absolute inset-0 bg-black z-1 transition-opacity duration-300 ease-in-out pointer-events-none"
                    style={{ opacity: scrollOpacity }}
                  ></div>
                </div>
              </div>
            )}
            {/* Постер фильма - Скрываем на мобильных (md и ниже) */}
            <div className="hidden md:flex flex-none w-72 flex-col">
              <div
                className={`relative aspect-[2/3] ${
                  roundedCorners ? "rounded-xl" : "rounded-lg"
                } overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer`}
                data-poster-container="true"
                onClick={openPlayer}
              >
                <img
                  alt={movie.title}
                  fetchPriority="high"
                  decoding="async"
                  data-nimg="fill"
                  className="object-cover transition-all duration-300"
                  src={getImageUrl(movie.poster_path || "", "w500")} // Добавляем || ""
                  style={{
                    position: "absolute",
                    height: "100%",
                    width: "100%",
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    color: "transparent",
                  }}
                />

                {/* Слой затемнения и иконка Play */}
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-70 transition-opacity duration-300 flex items-center justify-center">
                  <Play
                    className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100"
                    fill="white"
                    stroke="white"
                  />
                </div>
              </div>

              {/* Индикатор "В медиатеке" или уведомление - фиксированная высота - Скрываем на мобильных */}
              <div className="hidden md:block h-[38px] mt-2 mb-2">
                <AnimatePresence mode="wait">
                  {notification.visible ? (
                    <motion.div
                      key="notification"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`${notificationStyles.bgColor} ${notificationStyles.textColor} py-3 px-3 rounded-xl flex items-center gap-1.5 text-sm justify-center`}
                    >
                      <div className="flex-shrink-0">
                        {notificationStyles.icon}
                      </div>
                      <div className="flex-grow">{notification.message}</div>
                      <button
                        onClick={() =>
                          setNotification((prev) => ({
                            ...prev,
                            visible: false,
                          }))
                        }
                        className="flex-shrink-0 hover:opacity-80 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ) : (
                    isInitialized &&
                    isInWatchlistLocal && (
                      <motion.div
                        key="watchlist-indicator"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-3 px-3 bg-black text-yellow-500 rounded-xl flex items-center gap-1.5 text-sm justify-center"
                      >
                        <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-black" />
                        </div>
                        <span>В медиатеке</span>
                      </motion.div>
                    )
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Details - убираем motion.div и анимацию */}
            <div className="flex-1 flex flex-col items-center md:items-start">
              {" "}
              {/* Добавляем flex flex-col items-center md:items-start */}
              {/* Заголовок для десктопа (скрыт на мобильных) */}
              <h1 className="hidden md:block text-3xl font-bold mb-1 text-white">
                {movie.title}
                {movie.release_date &&
                  ` (${movie.release_date?.split("-")[0]})`}
              </h1>
              {/* Логотип или заголовок для мобильных */}
              <div className="block md:hidden mb-3 flex flex-col items-center">
                {" "}
                {/* Добавлено flex flex-col items-center */}
                {loadingLogo ? (
                  <div className="h-10 flex items-center">
                    <div className="w-6 h-6 border-2 border-gray-600 border-t-yellow-400 rounded-full animate-spin"></div>
                  </div>
                ) : logoPath ? (
                  <img
                    src={getImageUrl(logoPath, "w500")} // Используем w500 для лого
                    alt={`${movie.title} logo`}
                    className="max-h-10 object-contain" // Ограничиваем высоту
                    style={{
                      filter: "drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.5))", // Небольшая тень для читаемости
                    }}
                  />
                ) : (
                  // Fallback на текстовый заголовок, если лого нет
                  <h1 className="text-3xl font-bold text-white">
                    {movie.title}
                    {movie.release_date &&
                      ` (${movie.release_date?.split("-")[0]})`}
                  </h1>
                )}
              </div>
              <p className="text-gray-400 mb-3 text-sm relative text-center md:text-left">
                {" "}
                {/* Центрируем на мобильных, выравниваем влево на десктопе */}
                {(movie as any).original_title &&
                (movie as any).original_title !== movie.title ? (
                  <>
                    <span className="italic">
                      {(movie as any).original_title}
                    </span>
                    , {getDirector()}
                  </>
                ) : (
                  <>режиссёр: {getDirector()}</>
                )}
              </p>
              {/* === ОСНОВНОЙ КОНТЕЙНЕР ДЕТАЛЕЙ (flex-wrap) === */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-sm text-gray-300 mb-6 relative">
                {" "}
                {/* Центрируем на моб, выравниваем влево на десктопе */}
                {/* === ГРУППА 1: Рейтинг + Страны + Длительность === */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  {" "}
                  {/* Первая группа теперь с flex-wrap и gap-y-1 */}
                  {/* Рейтинг */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded ${getCertificationStyle(
                        certification
                      )}`}
                    >
                      {certification && certification !== "N/A"
                        ? certification.includes("+")
                          ? certification
                          : `${certification}+`
                        : (movie as any).adult
                        ? "18+"
                        : "PG"}
                    </span>
                  </div>
                  {/* Страны */}
                  {(movie as any).production_countries &&
                    (movie as any).production_countries.length > 0 && (
                      <div className="flex items-center gap-2">
                        {(movie as any).production_countries
                          .slice(0, 2)
                          .map((country: any) => (
                            <span
                              key={country.iso_3166_1}
                              className="flex items-center gap-1"
                            >
                              <ReactCountryFlag
                                countryCode={country.iso_3166_1}
                                svg
                                style={{
                                  width: "1.2em",
                                  height: "1.2em",
                                }}
                                title={country.name}
                              />
                              <span className="text-sm text-gray-300">
                                {getCountryNameRU(country.iso_3166_1)}
                              </span>
                            </span>
                          ))}
                      </div>
                    )}
                  {/* Длительность (перенесена сюда) */}
                  <span className="whitespace-nowrap">
                    {Math.floor((movie.runtime || 0) / 60)}ч{" "}
                    {(movie.runtime || 0) % 60}мин
                  </span>
                </div>
                {/* === ГРУППА 2: Качество + Жанры === */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {" "}
                  {/* Возвращаем items-center */}
                  {/* Качество (осталось здесь) */}
                  {movieQuality && (
                    <span className="px-1.5 py-0.5 bg-blue-600 rounded text-white text-xs font-medium whitespace-nowrap">
                      {movieQuality}
                    </span>
                  )}
                  {/* Жанры */}
                  {movie.genres && movie.genres.length > 0 && (
                    // Обертка для жанров остается с flex-wrap
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      {" "}
                      {/* Возвращаем items-center */}
                      {movie.genres?.map((genre, index) => (
                        <span
                          key={`${genre.id}-${index}`}
                          className="text-sm text-gray-300 whitespace-nowrap"
                        >
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4 relative">
                {" "}
                {/* Добавляем justify-center md:justify-start */}
                {/* Если фильм выпущен и есть какие-то рейтинги - показываем их */}
                {movie.status === "Released" &&
                  (movie.vote_average || imdbRating || kpRating ? (
                    <>
                      {(movie.vote_average ?? 0) > 0 && ( // Исправляем ?.
                        <div className="flex items-center gap-1 mr-2">
                          {/* Используем те же пороги что и для помидора: ≥75% (7.5) зеленый, ≥60% (6.0) желтый, <60% красный */}
                          {Math.round((movie.vote_average || 0) * 10) >= 75 ? (
                            <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                              <span className="text-sm">🍿</span>
                            </span>
                          ) : Math.round((movie.vote_average || 0) * 10) >=
                            60 ? (
                            <span className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
                              <span className="text-sm">🍿</span>
                            </span>
                          ) : (
                            <RottenTomatoIcon />
                          )}
                          <span className="text-sm font-medium text-white">
                            {movie.vote_average?.toFixed(1)}
                          </span>
                        </div>
                      )}

                      {(movie.vote_count ?? 0) > 0 && ( // Исправляем ?.
                        <div className="flex items-center gap-1 mr-2">
                          <span className="text-red-500">🍓</span>
                          <span className="text-sm text-gray-300">
                            {new Intl.NumberFormat("en-US", {
                              notation: "compact",
                              compactDisplay: "short",
                              maximumFractionDigits: 1,
                            }).format((movie as any).vote_count || 0)}
                          </span>
                        </div>
                      )}

                      {(movie.vote_average ?? 0) > 0 && ( // Исправляем ?.
                        <div className="flex items-center gap-1 mr-2">
                          <div className="flex items-center gap-1.5">
                            {/* Для процентного рейтинга используем обычный помидор в цветных кружках */}
                            {Math.round((movie.vote_average || 0) * 10) >=
                            75 ? (
                              <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                                🍅
                              </span>
                            ) : Math.round((movie.vote_average || 0) * 10) >=
                              60 ? (
                              <span className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
                                🍅
                              </span>
                            ) : (
                              <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                                🍅
                              </span>
                            )}
                            <span className="text-sm text-gray-300">
                              {Math.round((movie.vote_average || 0) * 10)}%
                            </span>
                          </div>
                        </div>
                      )}

                      {/* IMDb рейтинг */}
                      {imdbRating && (
                        <div className="flex items-center gap-1 mr-2">
                          <span className="flex items-center justify-center bg-[#F5C518] text-black text-xs font-bold px-1 rounded">
                            IMDb
                          </span>
                          <span className="text-sm font-medium text-white">
                            {imdbRating}
                          </span>
                        </div>
                      )}

                      {/* Кинопоиск рейтинг */}
                      {kpRating && (
                        <div className="flex items-center gap-1">
                          <span className="flex items-center justify-center bg-[#FF5500] text-white text-xs font-bold px-1 rounded">
                            КП
                          </span>
                          <span className="text-sm font-medium text-white">
                            {kpRating}
                          </span>
                        </div>
                      )}
                    </>
                  ) : // Если рейтингов нет, но есть дата выпуска - показываем её
                  movie.release_date ? (
                    <div className="flex items-center">
                      <span className="text-white font-medium">
                        Выпуск,{" "}
                        {(() => {
                          try {
                            const releaseDate = new Date(movie.release_date);
                            // Проверяем, что дата валидна
                            if (isNaN(releaseDate.getTime())) {
                              return "дата неизвестна";
                            }
                            // Пробуем использовать русскую локализацию
                            return releaseDate.toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            });
                          } catch (e) {
                            // Если не получилось, используем американскую
                            try {
                              const releaseDate = new Date(movie.release_date);
                              return releaseDate.toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              });
                            } catch {
                              return "дата неизвестна";
                            }
                          }
                        })()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">
                      Дата выхода не объявлена
                    </span>
                  ))}
                {/* Если фильм в пост-продакшне или запланирован - отображаем дату выпуска */}
                {(movie.status === "Post Production" ||
                  movie.status === "Planned" ||
                  movie.status === "In Production") && (
                  <div className="flex items-center">
                    {(() => {
                      // Проверяем, что у нас есть дата релиза и она валидна
                      if (movie.release_date) {
                        try {
                          const releaseDate = new Date(movie.release_date);
                          // Проверяем, что дата валидна
                          if (!isNaN(releaseDate.getTime())) {
                            let formattedDate;
                            try {
                              // Пробуем использовать русскую локализацию
                              formattedDate = releaseDate.toLocaleDateString(
                                "ru-RU",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                }
                              );
                            } catch (e) {
                              // Если не получилось, используем американскую
                              formattedDate = releaseDate.toLocaleDateString(
                                "en-US",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                }
                              );
                            }

                            return (
                              <span className="text-white font-medium">
                                Выпуск, {formattedDate}
                              </span>
                            );
                          }
                        } catch (e) {
                          // Ничего не делаем, покажем сообщение о неизвестной дате ниже
                        }
                      }

                      return (
                        <span className="text-gray-400">
                          Дата выхода не объявлена
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 md:gap-4 mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-full md:w-auto">
                    <WatchlistButtonWrapper
                      movie={movie}
                      onWatchlistAction={handleWatchlistAction}
                      className="text-sm px-3 py-1 pt-[8px] md:px-4 md:py-2 md:pt-[10px] w-full justify-center" // Уменьшил padding для мобильных
                    />
                  </div>
                  {/* Кнопка для открытия поповера с вариантами переводов */}
                  <button
                    className={cn(
                      "text-white rounded-lg transition-all overflow-hidden relative text-sm",
                      {
                        "pointer-events-none opacity-50":
                          isLoadingIframe || iframeButtonLoading,
                      }
                    )}
                    onClick={() => {
                      openTranslationPopover();
                    }}
                    title="Смотреть онлайн"
                  >
                    {/* Попап с вариантами переводов */}
                    {isTranslationPopoverOpen && translations.length > 0 && (
                      <div
                        ref={translationPopoverRef}
                        className="absolute top-full left-0 mt-2 p-4 bg-dark-card rounded-lg shadow-lg w-72 z-20 animate-fadeIn"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-white text-sm font-semibold">
                            Выберите перевод
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsTranslationPopoverOpen(false);
                              playSound("cancel.mp3");
                            }}
                            className="text-gray-400 hover:text-white"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto py-1">
                          {translations
                            .sort((a, b) => {
                              // Приоритизируем Дубляж выше
                              const aHasDubbing = a.name
                                .toLowerCase()
                                .includes("дубляж");
                              const bHasDubbing = b.name
                                .toLowerCase()
                                .includes("дубляж");

                              if (aHasDubbing && !bHasDubbing) return -1;
                              if (!aHasDubbing && bHasDubbing) return 1;

                              return a.name.localeCompare(b.name);
                            })
                            .map((translation) => (
                              <button
                                key={translation.id}
                                onClick={() => {
                                  playSound("confirm.mp3");
                                  selectTranslation(translation.id);
                                }}
                                className="text-left py-2 px-3 text-gray-200 hover:bg-black/20 rounded transition-colors flex items-center justify-between"
                              >
                                <span className="truncate">
                                  {translation.name}
                                </span>

                                {/* Добавляем иконку качества, если оно указано */}
                                {translation.quality &&
                                  translation.quality !== "Unknown" && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-brand-primary-hover text-white ml-2 whitespace-nowrap">
                                      {translation.quality}
                                    </span>
                                  )}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </button>
                </div>
                <div className="relative">
                  {/* Заменяем кнопку для открытия поповера на открытие Kinobox */}
                  <button
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-full bg-transparent hover:bg-white transition-all duration-300 hover:shadow-md group",
                      {
                        "pointer-events-none opacity-50":
                          isLoadingIframe || iframeButtonLoading,
                      }
                    )}
                    onClick={openKinoboxPlayer}
                    title="Смотреть онлайн"
                  >
                    <svg
                      aria-hidden="true"
                      className="w-6 h-6 text-white group-hover:text-black transition-colors duration-300"
                      fill="currentColor"
                      height="48"
                      viewBox="0 0 48 48"
                      width="48"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        clipRule="evenodd"
                        d="M42 24C42 31.2328 38.3435 37.6115 32.7782 41.3886C33.1935 41.2738 33.602 41.1447 34 41C45.1693 36.9384 47 32 47 32L48 35C48 35 44.3832 40.459 34.5 43.5C28 45.5 21 45 21 45C9.40202 45 0 35.598 0 24C0 12.402 9.40202 3 21 3C32.598 3 42 12.402 42 24ZM21 19C24.3137 19 27 16.3137 27 13C27 9.68629 24.3137 7 21 7C17.6863 7 15 9.68629 15 13C15 16.3137 17.6863 19 21 19ZM10 30C13.3137 30 16 27.3137 16 24C16 20.6863 13.3137 18 10 18C6.68629 18 4 20.6863 4 24C4 27.3137 6.68629 30 10 30ZM38 24C38 27.3137 35.3137 30 32 30C28.6863 30 26 27.3137 26 24C26 20.6863 28.6863 18 32 18C35.3137 18 38 20.6863 38 24ZM21 26C22.1046 26 23 25.1046 23 24C23 22.8954 22.1046 22 21 22C19.8954 22 19 22.8954 19 24C19 25.1046 19.8954 26 21 26ZM27 35C27 38.3137 24.3137 41 21 41C17.6863 41 15 38.3137 15 35C15 31.6863 17.6863 29 21 29C24.3137 29 27 31.6863 27 35Z"
                        fill="currentColor"
                        fillRule="evenodd"
                      />
                    </svg>
                  </button>

                  {iframeError && (
                    <div className="absolute top-10 right-0 z-10 bg-red-600 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      {iframeError}
                    </div>
                  )}
                </div>
                <div className="relative">
                  {/* Кнопка с галочкой */}
                  <button
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 hover:shadow-md group",
                      {
                        "bg-white/20 hover:bg-white": isWatched(movie.id),
                        "bg-transparent hover:bg-white": !isWatched(movie.id),
                      }
                    )}
                    title="Отметить как просмотренное"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      playSound("notification.mp3");

                      if (!isInWatchlist(movie.id)) {
                        // Если фильма нет в медиатеке, добавляем его
                        addToWatchlist({
                          id: movie.id,
                          title: movie.title || "Фильм без названия",
                          poster_path: movie.poster_path || "",
                          backdrop_path: movie.backdrop_path || "",
                          release_date: movie.release_date || "",
                          vote_average: movie.vote_average,
                          overview: movie.overview || "",
                          is_watched: true, // сразу отмечаем как просмотренный
                        });
                        showPosterNotification(
                          "Добавлено в просмотренное",
                          "success"
                        );
                      } else if (!isWatched(movie.id)) {
                        // Если фильм в медиатеке, но не отмечен как просмотренный
                        markAsWatched(movie.id);
                        showPosterNotification(
                          "Отмечено как просмотренное",
                          "success"
                        );
                      } else {
                        // Если фильм уже отмечен как просмотренный, снимаем отметку
                        markAsUnwatched(movie.id);
                        showPosterNotification(
                          "Отметка просмотра снята",
                          "info"
                        );
                      }

                      // Обновляем историю просмотров
                      addToHistory({
                        id: movie.id,
                        title: movie.title || "Фильм без названия",
                        poster_path: movie.poster_path || "",
                        backdrop_path: movie.backdrop_path || "",
                        release_date: movie.release_date || "",
                        vote_average: movie.vote_average,
                        overview: movie.overview || "",
                      });
                    }}
                  >
                    <svg
                      aria-hidden="true"
                      className={cn("w-6 h-6 transition-colors duration-300", {
                        "text-black": isWatched(movie.id),
                        "text-white group-hover:text-black": !isWatched(
                          movie.id
                        ),
                      })}
                      fill="currentColor"
                      height="48"
                      viewBox="0 0 48 48"
                      width="48"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.5 24.6195L21 32.121L34.5 18.6225L32.3775 16.5L21 27.879L15.6195 22.5L13.5 24.6195Z"
                        fill="currentColor"
                      ></path>
                      <path
                        clipRule="evenodd"
                        d="M12.333 6.53914C15.7865 4.23163 19.8466 3 24 3C29.5696 3 34.911 5.21249 38.8493 9.15076C42.7875 13.089 45 18.4305 45 24C45 28.1534 43.7684 32.2135 41.4609 35.667C39.1534 39.1204 35.8736 41.812 32.0364 43.4015C28.1991 44.9909 23.9767 45.4068 19.9031 44.5965C15.8295 43.7862 12.0877 41.7861 9.15077 38.8492C6.21386 35.9123 4.21381 32.1705 3.40352 28.0969C2.59323 24.0233 3.0091 19.8009 4.59854 15.9636C6.18798 12.1264 8.8796 8.84665 12.333 6.53914ZM13.9997 38.9665C16.9598 40.9443 20.4399 42 24 42C28.7739 42 33.3523 40.1036 36.7279 36.7279C40.1036 33.3523 42 28.7739 42 24C42 20.4399 40.9443 16.9598 38.9665 13.9997C36.9886 11.0397 34.1774 8.73255 30.8883 7.37017C27.5992 6.00779 23.98 5.65133 20.4884 6.34586C16.9967 7.0404 13.7894 8.75473 11.2721 11.2721C8.75474 13.7894 7.04041 16.9967 6.34587 20.4884C5.65134 23.98 6.0078 27.5992 7.37018 30.8883C8.73256 34.1774 11.0397 36.9886 13.9997 38.9665Z"
                        fill="currentColor"
                        fillRule="evenodd"
                      ></path>
                    </svg>
                  </button>
                </div>
                <div className="relative">
                  {/* Кнопка поделиться */}
                  <button
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-full bg-transparent hover:bg-white transition-all duration-300 hover:shadow-md group"
                    )}
                    onClick={() => {
                      // Используем Web Share API для открытия диалога шеринга
                      if (navigator.share) {
                        navigator
                          .share({
                            title: movie.title || "Фильм",
                            text: movie.overview || "Посмотрите этот фильм!",
                            url: window.location.href,
                          })
                          .catch((error) =>
                            console.log("Ошибка при шеринге:", error)
                          );
                      } else {
                        // Если Web Share API не поддерживается, копируем ссылку в буфер обмена
                        navigator.clipboard
                          .writeText(window.location.href)
                          .then(() => {
                            // Показываем уведомление
                            showPosterNotification(
                              "Ссылка скопирована в буфер обмена",
                              "success"
                            );
                          })
                          .catch((err) => {
                            console.error(
                              "Не удалось скопировать ссылку: ",
                              err
                            );
                          });
                      }
                    }}
                    title="Поделиться"
                  >
                    <svg
                      aria-hidden="true"
                      className="w-6 h-6 text-white group-hover:text-black transition-colors duration-300"
                      fill="currentColor"
                      height="48"
                      viewBox="0 0 48 48"
                      width="48"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M25.5 5.745L30.885 11.115L33 9L24 0L15 9L17.115 11.115L22.5 5.745V27H25.5V5.745Z"
                        fill="currentColor"
                      ></path>
                      <path
                        d="M5 17V40C5 40.7956 5.31607 41.5587 5.87868 42.1213C6.44129 42.6839 7.20435 43 8 43H40C40.7956 43 41.5587 42.6839 42.1213 42.1213C42.6839 41.5587 43 40.7957 43 40V17C43 16.2043 42.6839 15.4413 42.1213 14.8787C41.5587 14.3161 40.7957 14 40 14H35.5V17H40V40H8L8 17H12.5V14L8 14C7.20435 14 6.44129 14.3161 5.87868 14.8787C5.31607 15.4413 5 16.2043 5 17Z"
                        fill="currentColor"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mb-8 relative">
                {/* Сначала показываем слоган, если он есть */}
                {(movie as any).tagline && (
                  <p className="text-gray-400 italic mb-2">
                    "{(movie as any).tagline}"
                  </p>
                )}
                {/* Затем описание фильма */}
                <p
                  className={`text-gray-300 ${
                    !isExpanded && "line-clamp-3"
                  } max-w-3xl md:max-w-2xl lg:max-w-3xl`}
                >
                  {movie.overview}
                </p>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 mt-2"
                >
                  <span>Подробнее</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Слайдер с актерами */}
          <div className="mt-2 md:mt-8">
            <div className="mb-1 px-2">
              {" "}
              {/* Этот отступ оставляем для заголовка */}
              <div className="flex flex-col">
                <div className="flex items-center">
                  <h2 className="text-xl uppercase tracking-wide font-bebas-neue pb-2 pr-8 relative border-b border-transparent">
                    АКТЕРЫ
                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent"></div>
                  </h2>
                </div>
              </div>
            </div>

            {/* Убираем лишний относительный контейнер, если он мешает */}
            {/* <div className="relative"> */}
            {loadingCast ? ( // Скелетон загрузки актеров
              <div className="px-10">
                <div className="flex overflow-x-auto gap-4 pb-4 snap-x ">
                  {Array(8)
                    .fill(0)
                    .map((_, index) => (
                      <div key={index} className="flex-none w-32 snap-start">
                        <div className="bg-gray-800/40 animate-pulse aspect-[2/3] rounded mb-2"></div>
                        <div className="bg-gray-800/40 animate-pulse h-4 w-24 rounded mb-1"></div>
                        <div className="bg-gray-800/40 animate-pulse h-3 w-16 rounded"></div>
                      </div>
                    ))}
                </div>
              </div>
            ) : cast && cast.length > 0 ? (
              <section className="relative">
                <div className="group relative">
                  {/* === ИЗМЕНЯЕМ КЛАССЫ СЛАЙДЕРА АКТЕРОВ === */}
                  <div className="flex gap-1 md:gap-4 overflow-x-auto scrollbar-hide scroll-smooth -mx-4 md:-mx-10 px-4 md:px-10 py-2 relative actor-row">
                    {cast.map((person) => (
                      <div
                        key={`actor-${person.id}`}
                        className="flex-none w-[130px] md:w-[180px] relative group/item" // Уменьшил ширину контейнера на мобильных
                      >
                        <Link
                          href={`/actors/${person.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            playSound("choose.mp3");
                          }}
                        >
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="flex flex-col items-center" // Центрируем содержимое карточки
                          >
                            <div
                              className={`relative rounded-full overflow-hidden mb-1 md:mb-3 w-[130px] h-[130px] md:w-[170px] md:h-[170px] transition-all duration-200 border-[3px] border-transparent hover:border-white`}
                            >
                              {person.profile_path ? (
                                <Image
                                  src={getImageUrl(person.profile_path, "w500")}
                                  alt={person.name}
                                  fill
                                  sizes="170px"
                                  quality={85}
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500 hover:text-gray-300 transition-all">
                                  <User size={48} />
                                </div>
                              )}
                            </div>
                            {/* Контейнер для текста с ограничением ширины */}
                            <div className="w-[130px] md:w-[170px]">
                              <h3 className="text-sm font-medium text-center truncate mt-1">
                                {person.name}
                              </h3>
                              <p className="text-xs text-gray-400 text-center line-clamp-1">
                                {person.character}
                              </p>
                            </div>
                          </motion.div>
                        </Link>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      const container = document.querySelector(".actor-row");
                      if (container) {
                        container.scrollBy({
                          left: -300,
                          behavior: "smooth",
                        });
                      }
                    }}
                    className="absolute top-1/2 -translate-y-1/2 left-2 z-10 p-2 rounded-full 
                             bg-yellow-400 hover:bg-yellow-500 text-black 
                             transition-all duration-300 disabled:opacity-0 disabled:cursor-not-allowed 
                             opacity-0 md:group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => {
                      const container = document.querySelector(".actor-row");
                      if (container) {
                        container.scrollBy({
                          left: 300,
                          behavior: "smooth",
                        });
                      }
                    }}
                    className="absolute top-1/2 -translate-y-1/2 right-2 z-10 p-2 rounded-full 
                             bg-yellow-400 hover:bg-yellow-500 text-black 
                             transition-all duration-300 disabled:opacity-0 disabled:cursor-not-allowed 
                             opacity-0 md:group-hover:opacity-100"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </section>
            ) : (
              <div className="text-gray-400 py-4 text-center px-6">
                Информация об актёрском составе недоступна
              </div>
            )}
            {/* </div> */}
          </div>

          {/* Блок с рецензиями */}
          <div className="mt-8">
            <div className="px-2 mb-2">
              <div className="flex flex-col">
                <div className="flex items-center">
                  <h2 className="text-xl uppercase tracking-wide font-bebas-neue pb-2 pr-8 relative border-b border-transparent">
                    РЕЦЕНЗИИ
                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent"></div>
                  </h2>
                </div>
              </div>
            </div>

            <div className="relative">
              {loadingReviews ? (
                <div className="flex justify-center w-full py-6 px-10">
                  {" "}
                  {/* Loading Skeleton */}
                  <div className="w-8 h-8 border-2 border-gray-600 border-t-yellow-400 rounded-full animate-spin"></div>
                </div>
              ) : reviews.length > 0 ? (
                <section className="relative">
                  <div className="group relative">
                    {/* === ИЗМЕНЯЕМ КЛАССЫ СЛАЙДЕРА РЕЦЕНЗИЙ === */}
                    <div className="flex overflow-x-auto gap-4 py-2 -mx-4 md:-mx-10 px-4 md:px-10 relative trailer-row scrollbar-hide scroll-smooth">
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="flex-none w-72 p-1 relative group/item" // Outer container with p-1
                          onClick={() => setSelectedReview(review)}
                        >
                          <div className="bg-gray-800/50 rounded-lg p-3 cursor-pointer border-2 border-transparent hover:border-white hover:border-opacity-80 transition-colors duration-300 h-full flex flex-col">
                            {" "}
                            {/* Inner card with p-3 */}
                            <div className="flex items-start mb-3 flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 mr-3 overflow-hidden">
                                {review.isDiscussion ? (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400">
                                    <MessageCircle size={20} />
                                  </div>
                                ) : review.author_details?.avatar_path ? (
                                  <img
                                    src={
                                      review.author_details.avatar_path.startsWith(
                                        "/http"
                                      )
                                        ? review.author_details.avatar_path.substring(
                                            1
                                          )
                                        : `https://imagetmdb.com/t/p/w100_and_h100_face${review.author_details.avatar_path}`
                                    }
                                    alt={review.author}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400">
                                    <User size={20} />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-center">
                                  <h3 className="text-white font-medium">
                                    {review.author}
                                  </h3>
                                  <span className="text-xs py-0.5 px-1.5 rounded bg-gray-700 text-gray-300">
                                    {review.language === "ru" ? "RU" : "EN"}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  {review.isDiscussion &&
                                    review.likes !== 0 && (
                                      <div className="flex items-center mr-2">
                                        <ThumbsUp
                                          size={14}
                                          className="text-blue-400 mr-1"
                                          fill={
                                            review.likes > 0
                                              ? "currentColor"
                                              : "none"
                                          }
                                        />
                                        <span className="text-xs text-gray-300">
                                          {review.likes}
                                        </span>
                                      </div>
                                    )}
                                  {!review.isDiscussion &&
                                    review.author_details?.rating && (
                                      <div className="flex items-center mr-2">
                                        <Star
                                          size={14}
                                          className="text-yellow-400 mr-1"
                                          fill="currentColor"
                                        />
                                        <span className="text-xs text-gray-300">
                                          {review.author_details.rating}/10
                                        </span>
                                      </div>
                                    )}
                                  <span className="text-xs text-gray-400">
                                    {new Date(
                                      review.created_at
                                    ).toLocaleDateString("ru-RU", {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-gray-300 text-sm review-content max-h-36 overflow-y-auto flex-grow">
                              {" "}
                              {/* Adjusted max-h, added flex-grow */}
                              {review.content.length > 250
                                ? `${review.content.substring(0, 250)}...`
                                : review.content}
                              {review.content.length > 250 && (
                                <div className="block mt-2 text-yellow-400 hover:text-yellow-500 transition-colors">
                                  Читать полностью
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Navigation buttons */}
                    <button
                      onClick={() => {
                        const container = document.querySelector(".review-row");
                        if (container) {
                          container.scrollBy({
                            left: -300,
                            behavior: "smooth",
                          });
                        }
                      }}
                      className="absolute top-1/2 -translate-y-1/2 left-2 z-10 p-2 rounded-full 
                               bg-yellow-400 hover:bg-yellow-500 text-black 
                               transition-all duration-300 disabled:opacity-0 disabled:cursor-not-allowed 
                               opacity-0 md:group-hover:opacity-100"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => {
                        const container = document.querySelector(".review-row");
                        if (container) {
                          container.scrollBy({
                            left: 300,
                            behavior: "smooth",
                          });
                        }
                      }}
                      className="absolute top-1/2 -translate-y-1/2 right-2 z-10 p-2 rounded-full 
                               bg-yellow-400 hover:bg-yellow-500 text-black 
                               transition-all duration-300 disabled:opacity-0 disabled:cursor-not-allowed 
                               opacity-0 md:group-hover:opacity-100"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                </section>
              ) : (
                <div className="px-10">
                  {" "}
                  {/* Нет рецензий */}
                  <div className="py-4 text-gray-400 text-center ">
                    Для этого фильма пока нет рецензий
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Модальное окно для просмотра полной рецензии */}
          {selectedReview && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 md:p-8"
              onClick={() => setSelectedReview(null)}
            >
              <div
                className="bg-gray-800 rounded-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-xl border border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-gray-800 rounded-t-xl p-4 border-b border-gray-700 flex justify-between items-center z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                        {selectedReview.isDiscussion ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400">
                            <MessageCircle size={20} />
                          </div>
                        ) : selectedReview.author_details?.avatar_path ? (
                          <img
                            src={
                              selectedReview.author_details.avatar_path.startsWith(
                                "/http"
                              )
                                ? selectedReview.author_details.avatar_path.substring(
                                    1
                                  )
                                : `https://imagetmdb.com/t/p/w100_and_h100_face${selectedReview.author_details.avatar_path}`
                            }
                            alt={selectedReview.author}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400">
                            <User size={20} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-white font-medium text-lg">
                          {selectedReview.author}
                        </h3>
                        <div className="flex items-center">
                          {selectedReview.isDiscussion &&
                            selectedReview.likes !== 0 && (
                              <div className="flex items-center mr-2">
                                <ThumbsUp
                                  size={14}
                                  className="text-blue-400 mr-1"
                                  fill={
                                    selectedReview.likes > 0
                                      ? "currentColor"
                                      : "none"
                                  }
                                />
                                <span className="text-xs text-gray-300">
                                  {selectedReview.likes}
                                </span>
                              </div>
                            )}
                          {!selectedReview.isDiscussion &&
                            selectedReview.author_details?.rating && (
                              <div className="flex items-center mr-2">
                                <Star
                                  size={14}
                                  className="text-yellow-400 mr-1"
                                  fill="currentColor"
                                />
                                <span className="text-xs text-gray-300">
                                  {selectedReview.author_details.rating}/10
                                </span>
                              </div>
                            )}
                          <span className="text-xs text-gray-400">
                            {new Date(
                              selectedReview.created_at
                            ).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                          <span className="ml-2 text-xs py-0.5 px-1.5 rounded bg-gray-700 text-gray-300">
                            {selectedReview.language === "ru" ? "RU" : "EN"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    className="text-gray-400 hover:text-white p-1 rounded-full transition-colors"
                    onClick={() => setSelectedReview(null)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="p-4 md:p-6 text-gray-200 whitespace-pre-line">
                  {selectedReview.content}
                </div>
                {!selectedReview.isDiscussion && selectedReview.url && (
                  <div className="p-4 pt-0 md:p-6 md:pt-0 border-t border-gray-700">
                    <a
                      href={selectedReview.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-yellow-400 hover:text-yellow-500 transition-colors"
                    >
                      Перейти к оригиналу рецензии
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Блок РЕКОМЕНДАЦИИ */}
          {(loadingRecommendations ||
            (recommendations && recommendations.length > 0)) && (
            <div className="mt-8">
              <div className="px-6 mb-4">
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <h2 className="text-xl uppercase tracking-wide font-bebas-neue pb-2 pr-8 relative border-b border-transparent">
                      РЕКОМЕНДАЦИИ
                      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent"></div>
                    </h2>
                  </div>
                </div>
              </div>

              <div className="relative">
                {loadingRecommendations ? (
                  <div className="px-10">
                    {" "}
                    {/* Loading Skeleton */}
                    <div className="flex overflow-x-auto gap-4 pb-4 snap-x ">
                      {Array(6)
                        .fill(0)
                        .map((_, index) => (
                          <div
                            key={index}
                            className="flex-none w-72 snap-start"
                          >
                            <div className="bg-gray-800/40 animate-pulse aspect-video rounded mb-2"></div>
                            <div className="bg-gray-800/40 animate-pulse h-4 w-56 rounded mb-1"></div>
                            <div className="bg-gray-800/40 animate-pulse h-3 w-32 rounded"></div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <MovieRow
                    title=""
                    items={recommendations}
                    variant="backdrop"
                    posterSize="normal"
                    showDate
                    showLogo
                    showYear
                    hideTitle
                    onMovieClick={() => playSound("choose.mp3")}
                    containerClassName="-mx-4 md:-mx-10 px-4 md:px-10" // Добавляем необходимые классы отступов
                    disableGlowEffect={true}
                  />
                )}
              </div>
            </div>
          )}

          {/* Блок ТРЕЙЛЕРЫ */}
          {(loadingTrailers || (trailers && trailers.length > 0)) && (
            <div className="mt-8">
              <div className="px-6 mb-4">
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <h2 className="text-xl uppercase tracking-wide font-bebas-neue pb-2 pr-8 relative border-b border-transparent">
                      ТРЕЙЛЕРЫ
                      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent"></div>
                    </h2>
                  </div>
                </div>
              </div>

              <div className="relative">
                {loadingTrailers ? (
                  <div className="px-10">
                    {" "}
                    {/* Loading Skeleton */}
                    <div className="flex overflow-x-auto gap-4 py-2 ">
                      {Array(4)
                        .fill(0)
                        .map((_, index) => (
                          <div
                            key={index}
                            className="flex-none w-72 snap-start"
                          >
                            <div className="bg-gray-800/40 animate-pulse aspect-video rounded mb-2"></div>
                            <div className="bg-gray-800/40 animate-pulse h-4 w-56 rounded mb-1"></div>
                            <div className="bg-gray-800/40 animate-pulse h-3 w-32 rounded"></div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <section className="relative">
                    <div className="group relative">
                      <div className="flex overflow-x-auto gap-4 py-2 -mx-4 md:-mx-10 px-4 md:px-10 relative trailer-row scrollbar-hide scroll-smooth">
                        {trailers.map((trailer, index) => (
                          <div
                            key={`${trailer.id || trailer.key}-${index}`}
                            className="flex-none w-72 p-1 relative group/item" // Возвращаем p-1
                          >
                            <div className="h-full flex flex-col">
                              {" "}
                              {/* Inner container for flex layout */}
                              <div
                                className="aspect-video bg-gray-800 rounded-lg overflow-hidden group relative cursor-pointer mb-2 border-2 border-transparent group-hover/item:border-white transition-colors duration-200"
                                onClick={() => playTrailer(trailer)}
                              >
                                {/* Постоянное затемнение поверх превью */}
                                <div className="absolute inset-0 bg-black/50"></div>

                                <img
                                  src={`https://img.youtube.com/vi/${trailer.key}/mqdefault.jpg`}
                                  alt={trailer.name}
                                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                                  loading="lazy"
                                />

                                {/* Всегда видимая иконка Play по центру */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Play
                                    className="w-16 h-16 text-white"
                                    fill="white"
                                    stroke="white"
                                  />
                                </div>
                              </div>
                              <p className="text-sm font-medium line-clamp-1 flex-grow">
                                {trailer.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {trailer.iso_639_1
                                  ? `Язык: ${trailer.iso_639_1.toUpperCase()}`
                                  : ""}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Navigation buttons */}
                      <button
                        onClick={() => {
                          const container =
                            document.querySelector(".trailer-row");
                          if (container) {
                            container.scrollBy({
                              left: -300,
                              behavior: "smooth",
                            });
                          }
                        }}
                        className="absolute top-1/2 -translate-y-1/2 left-2 z-10 p-2 rounded-full 
                                 bg-yellow-400 hover:bg-yellow-500 text-black 
                                 transition-all duration-300 disabled:opacity-0 disabled:cursor-not-allowed 
                                 opacity-0 md:group-hover:opacity-100"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => {
                          const container =
                            document.querySelector(".trailer-row");
                          if (container) {
                            container.scrollBy({
                              left: 300,
                              behavior: "smooth",
                            });
                          }
                        }}
                        className="absolute top-1/2 -translate-y-1/2 right-2 z-10 p-2 rounded-full 
                                 bg-yellow-400 hover:bg-yellow-500 text-black 
                                 transition-all duration-300 disabled:opacity-0 disabled:cursor-not-allowed 
                                 opacity-0 md:group-hover:opacity-100"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </div>
                  </section>
                )}
                {/* Добавляем сообщение об отсутствии трейлеров */}
                {!loadingTrailers && trailers.length === 0 && (
                  <div className="px-10">
                    <p className="text-gray-400 text-center py-4">
                      Трейлеры для этого фильма недоступны.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Блок ПОХОЖИЕ ФИЛЬМЫ */}
          {(loadingSimilar || (similarMovies && similarMovies.length > 0)) && (
            <div className="mt-8">
              <div className="px-6 mb-4">
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <h2 className="text-xl uppercase tracking-wide font-bebas-neue pb-2 pr-8 relative border-b border-transparent">
                      ПОХОЖИЕ ФИЛЬМЫ
                      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent"></div>
                    </h2>
                  </div>
                </div>
              </div>

              <div className="relative">
                {loadingSimilar ? (
                  <div className="px-10">
                    {" "}
                    {/* Loading Skeleton */}
                    <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
                      {Array(6)
                        .fill(0)
                        .map((_, index) => (
                          <div
                            key={index}
                            className="flex-none w-72 snap-start"
                          >
                            <div className="bg-gray-800/40 animate-pulse aspect-video rounded mb-2"></div>
                            <div className="bg-gray-800/40 animate-pulse h-4 w-56 rounded mb-1"></div>
                            <div className="bg-gray-800/40 animate-pulse h-3 w-32 rounded"></div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <MovieRow
                    title=""
                    items={similarMovies}
                    variant="backdrop"
                    posterSize="normal"
                    showDate
                    showLogo
                    showYear
                    hideTitle
                    onMovieClick={() => playSound("choose.mp3")}
                    containerClassName="-mx-4 md:-mx-10 px-4 md:px-10" // Добавляем необходимые классы отступов
                    disableGlowEffect={true}
                  />
                )}
              </div>
            </div>
          )}

          {/* Блок КИНОСТУДИИ */}
          {(movie as any).production_companies &&
            (movie as any).production_companies.length > 0 && (
              <div className="mt-8">
                <div className="px-6 mb-4">
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <h2 className="text-xl uppercase tracking-wide font-bebas-neue pb-2 pr-8 relative border-b border-transparent">
                        КИНОСТУДИИ
                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent"></div>
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="relative px-4 md:px-6">
                  {" "}
                  {/* Уменьшаем отступ на мобильных */}
                  <div className="flex overflow-x-auto gap-4 pb-4 snap-x cast-scroll-container">
                    {(movie as any).production_companies.map((company: any) => (
                      <div
                        key={company.id}
                        className="flex-none w-80 snap-start"
                      >
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-transparent hover:border-white transition-all">
                          <div className="flex flex-col items-center gap-3">
                            {company.logo_path ? (
                              <div className="h-16 flex items-center justify-center">
                                <img
                                  src={getImageUrl(company.logo_path, "w200")}
                                  alt={company.name}
                                  className="max-h-16 max-w-[150px] object-contain"
                                  loading="lazy"
                                />
                              </div>
                            ) : (
                              <div className="h-16 flex items-center justify-center">
                                <Building2 className="w-10 h-10 text-gray-400" />
                              </div>
                            )}
                            <div className="text-center">
                              <p className="text-white text-sm font-medium">
                                {company.name}
                              </p>
                              {company.origin_country && (
                                <p className="text-gray-400 text-xs">
                                  {getCountryNameRU(company.origin_country) ||
                                    company.origin_country}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          {/* Блок КОЛЛЕКЦИЯ */}
          {(loadingCollection ||
            (collectionInfo &&
              collectionMovies &&
              collectionMovies.length > 0)) && (
            <div className="mt-8">
              <div className="px-6 mb-4">
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <h2 className="text-xl uppercase tracking-wide font-bebas-neue pb-2 pr-8 relative border-b border-transparent">
                      КОЛЛЕКЦИЯ
                      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent"></div>
                    </h2>
                  </div>
                </div>
              </div>

              <div className="relative">
                {loadingCollection ? (
                  <div>
                    <div className="mb-6 px-6">
                      <div className="bg-gray-800/40 animate-pulse h-6 w-64 rounded mb-3"></div>
                      <div className="bg-gray-800/40 animate-pulse h-4 w-full max-w-2xl rounded"></div>
                    </div>
                    <div className="px-6">
                      <div className="flex overflow-x-auto gap-4 pb-4 snap-x cast-scroll-container">
                        {Array(6)
                          .fill(0)
                          .map((_, index) => (
                            <div
                              key={index}
                              className="flex-none w-36 snap-start"
                            >
                              <div className="bg-gray-800/40 animate-pulse aspect-[2/3] rounded mb-2"></div>
                              <div className="bg-gray-800/40 animate-pulse h-4 w-28 rounded mb-1"></div>
                              <div className="bg-gray-800/40 animate-pulse h-3 w-20 rounded"></div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="-mx-4 md:-mx-10 px-4 md:px-10">
                    {" "}
                    {/* Обертка для overflow */}
                    <MovieRow
                      title=""
                      items={collectionMovies}
                      variant="poster"
                      posterSize="normal"
                      showDate
                      showYear
                      hideTitle
                      onMovieClick={() => playSound("choose.mp3")}
                      containerClassName="" // Убираем дублирующиеся отступы отсюда
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Блок ПОСТЕРЫ ИЗОБРАЖЕНИЯ */}
          {(loadingImages ||
            loadingPosters ||
            (movieImages && movieImages.length > 0) ||
            (moviePosters && moviePosters.length > 0)) && (
            <div className="mt-8">
              <div className="px-6 mb-4">
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <h2 className="text-xl uppercase tracking-wide font-bebas-neue pb-2 pr-8 relative border-b border-transparent">
                      ИЗОБРАЖЕНИЯ
                      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent"></div>
                    </h2>
                  </div>
                </div>
              </div>

              {/* Секция с изображениями фильма */}
              {(loadingImages || (movieImages && movieImages.length > 0)) && (
                <div className="relative px-4 md:px-6 mb-8">
                  {" "}
                  {/* Уменьшаем отступ на мобильных */}
                  {loadingImages ? (
                    <div className="flex overflow-x-auto gap-4 pb-4 snap-x cast-scroll-container">
                      {Array(5)
                        .fill(0)
                        .map((_, index) => (
                          <div
                            key={index}
                            className="flex-none w-80 snap-start"
                          >
                            <div className="bg-gray-800/40 animate-pulse aspect-video rounded mb-2"></div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex overflow-x-auto gap-4 pb-4 snap-x cast-scroll-container">
                      {movieImages.map((image, index) => (
                        <div
                          key={`backdrop-${index}`}
                          className="flex-none w-80 snap-start"
                        >
                          <div
                            className="aspect-video bg-gray-800 rounded-lg overflow-hidden mb-2 hover:ring-2 hover:ring-yellow-500 transition-all cursor-pointer"
                            onClick={() => openImageModal(image.file_path)}
                          >
                            <img
                              src={getImageUrl(image.file_path, "w780")}
                              alt={`Изображение ${index + 1}`}
                              className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                              loading="lazy"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Секция с постерами фильма */}
              {(loadingPosters ||
                (moviePosters && moviePosters.length > 0)) && (
                // === ИЗМЕНЯЕМ КЛАССЫ КОНТЕЙНЕРА ПОСТЕРОВ ===
                <div className="relative px-4 md:px-6">
                  {" "}
                  {/* Уменьшаем отступ на мобильных */}
                  <h3 className="text-lg font-medium mb-4 text-white">
                    Постеры
                  </h3>
                  {loadingPosters ? (
                    <div className="flex overflow-x-auto gap-4 pb-4 snap-x cast-scroll-container">
                      {Array(8)
                        .fill(0)
                        .map((_, index) => (
                          <div
                            key={index}
                            className="flex-none w-36 snap-start"
                          >
                            <div className="bg-gray-800/40 animate-pulse aspect-[2/3] rounded mb-2"></div>
                            <div className="bg-gray-800/40 animate-pulse h-3 w-20 rounded"></div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex overflow-x-auto gap-4 pb-4 snap-x cast-scroll-container">
                      {moviePosters.map((poster, index) => (
                        <div
                          key={`poster-${index}`}
                          className="flex-none w-36 snap-start"
                        >
                          <div
                            className={`aspect-[2/3] bg-gray-800 ${
                              roundedCorners ? "rounded-xl" : "rounded-lg"
                            } overflow-hidden mb-2 hover:ring-2 hover:ring-yellow-500 transition-all cursor-pointer`}
                            onClick={() => openImageModal(poster.file_path)}
                          >
                            <img
                              src={getImageUrl(poster.file_path, "w300")}
                              alt={`Постер ${index + 1}`}
                              className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                              loading="lazy"
                            />
                          </div>
                          {poster.iso_639_1 && (
                            <p className="text-xs text-gray-400">
                              Язык: {poster.iso_639_1.toUpperCase()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Модальное окно для просмотра трейлера */}
      <AnimatePresence>
        {selectedTrailer && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="absolute inset-0 bg-black/80"
              onClick={closeTrailer}
            ></div>
            <motion.div
              className="relative w-full max-w-4xl aspect-video z-10"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${selectedTrailer.key}?autoplay=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
              <button
                className="absolute -top-10 right-0 text-white hover:text-yellow-400 transition-colors"
                onClick={closeTrailer}
              >
                <X className="w-8 h-8" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модальное окно для просмотра изображений */}
      <AnimatePresence>
        {isImageModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={closeImageModal}
          >
            <div className="relative max-w-[90vw] max-h-[90vh]">
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
                src={currentImage}
                alt="Увеличенное изображение"
                className="max-w-full max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
                onClick={closeImageModal}
              >
                <X size={24} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Отображаем iframe плеер, если открыт */}
      {isIframeOpen && iframeUrl && (
        <IframePlayer url={iframeUrl} onClose={closeIframe} />
      )}

      {/* Добавляем Kinobox плеер */}
      {isKinoboxOpen && kinoboxId && (
        <KinoboxPlayer kpId={kinoboxId} onClose={closeKinoboxPlayer} />
      )}

      {/* === РЕНДЕРИНГ УВЕДОМЛЕНИЯ О КОЛЛЕКЦИИ === */}
      <AnimatePresence>
        {showCollectionNotification &&
          collectionMovies.length > 1 &&
          collectionInfo && (
            <CollectionNotification
              movies={collectionMovies}
              collectionName={collectionInfo.name}
              currentMovieId={movie.id} // Передаем ID текущего фильма
              onClose={() => setShowCollectionNotification(false)}
            />
          )}
      </AnimatePresence>

      {/* === РЕНДЕРИНГ САЙДБАРА === */}
      <AnimatePresence>
        {isSidebarOpen && (
          <MovieInfoSidebar
            movie={movie}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            logoPath={logoPath} // Передаем logoPath
            loadingLogo={loadingLogo} // Передаем loadingLogo
          />
        )}
      </AnimatePresence>

      {/* === КНОПКА ОТКРЫТИЯ САЙДБАРА === */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="fixed top-1/2 -translate-y-1/2 right-0 z-[80] p-2 bg-black/50 hover:bg-black/70 text-white rounded-l-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center"
        title="Информация о фильме"
        style={{ writingMode: "vertical-rl", textOrientation: "mixed" }} // Вертикальная кнопка
      >
        <Info size={20} className="mb-1" /> {/* Иконка сверху */}
        <span className="text-xs font-medium">Инфо</span>
      </button>

      {/* === РЕНДЕРИНГ УВЕДОМЛЕНИЯ ОБ АКТЕРАХ === */}
      <AnimatePresence>
        {showActorNotification &&
          topActors.length > 0 &&
          typeof movie.id === "number" && (
            <ActorNotification
              actors={topActors}
              onClose={() => setShowActorNotification(false)}
              currentMovieId={movie.id}
            />
          )}
      </AnimatePresence>
    </>
  );
}
