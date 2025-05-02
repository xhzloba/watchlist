"use client";

import Link from "next/link";
import {
  Home,
  Compass,
  MonitorSmartphone,
  Bell,
  ChevronDown,
  User,
  X,
  Expand,
  Shrink,
  Bookmark,
  Calendar,
  CalendarDays,
  Clock,
  Search,
  ChevronUp,
  Menu,
} from "lucide-react";
import SearchBar from "./search-bar";
import { useColorContext } from "@/contexts/color-context";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useId } from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import dynamic from "next/dynamic";
import { getImageUrl } from "@/lib/tmdb";
import { useUsername } from "@/contexts/username-context";
import { useDebounce } from "@/hooks/use-debounce";
import clsx from "clsx";
import { playSound } from "@/lib/sound-utils";

// Создаем безопасные функции для работы с localStorage
function safeGetItem(key: string): string | null {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error("Error accessing localStorage:", e);
      return null;
    }
  }
  return null;
}

function safeSetItem(key: string, value: string): boolean {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error("Error writing to localStorage:", e);
      return false;
    }
  }
  return false;
}

// Компонент AI эффекта для логотипа HD Planet
const HDPlanetLogo = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Эффект анимации при монтировании
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="relative font-bold py-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Базовый слой текста */}
      <div
        className={`flex items-center relative z-10 transition-all duration-500 ${
          isHovered ? "scale-105 translate-y-[1px]" : ""
        } ${isAnimating ? "animate-text-shimmer" : ""}`}
      >
        <span
          className={`relative text-yellow-400 font-bebas-neue text-xl tracking-wider transition-colors duration-300 ${
            isHovered ? "text-yellow-300" : ""
          }`}
        >
          WATCH
          {isHovered && (
            <span className="absolute -inset-1 bg-gradient-to-r from-transparent via-yellow-300/20 to-transparent animate-shimmer rounded-sm blur-[1px] -z-10" />
          )}
        </span>
        <span
          className={`relative text-white font-bebas-neue text-xl tracking-wider transition-all duration-300 ${
            isHovered ? "text-white tracking-wider" : ""
          }`}
        >
          LIST
          {isHovered && (
            <span className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer rounded-sm blur-[1px] -z-10" />
          )}
        </span>
      </div>

      {/* Основное свечение вокруг текста */}
      <div
        className={`absolute inset-0 -z-10 bg-gradient-to-r from-yellow-500/10 to-yellow-600/15 rounded-2xl blur-xl w-full h-full transition-opacity duration-500 ${
          isHovered ? "opacity-100 scale-110" : "opacity-0 scale-100"
        }`}
      ></div>

      {/* Эффект планеты/круга для HD */}
      <div
        className={`absolute -left-3 -top-1 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/30 transition-all duration-300 ${
          isHovered
            ? "opacity-100 scale-110 blur-[2px]"
            : "opacity-40 blur-[1px]"
        }`}
      ></div>

      {/* Кольцо вокруг планеты */}
      <div
        className={`absolute -left-4 top-0 w-8 h-4 rounded-full border-t border-yellow-500/30 rotate-[30deg] transition-all duration-300 ${
          isHovered ? "opacity-80 scale-110" : "opacity-30"
        }`}
      ></div>

      {/* AI эффекты: частицы и свечение */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        {/* Фоновое свечение для текста */}
        <div
          className={`absolute inset-0 w-full h-full blur-sm transition-all duration-300 ${
            isHovered ? "opacity-70 scale-105" : "opacity-40 scale-100"
          }`}
        >
          <span
            className={`absolute text-yellow-300/30 font-bold font-bebas-neue text-2xl transition-all duration-500 ${
              isHovered
                ? "animate-pulse-slow transform rotate-1 translate-y-[0.5px]"
                : "animate-pulse transform rotate-1"
            }`}
          >
            HD
          </span>
          <span
            className={`absolute left-[calc(100%*0.18)] text-white/30 font-bold font-bebas-neue text-2xl transition-all duration-500 ${
              isHovered
                ? "animate-pulse-slow transform -rotate-1 translate-y-[-0.5px]"
                : "animate-pulse transform -rotate-1"
            }`}
          >
            PLANET
          </span>
        </div>

        {/* Частицы вокруг текста - видны всегда */}
        <div
          className={`absolute top-0 left-1/4 w-0.5 h-0.5 bg-yellow-400/70 rounded-full animate-particle-1 shadow-glow-sm ${
            isHovered ? "opacity-90" : "opacity-70"
          }`}
        ></div>
        <div
          className={`absolute top-1/2 right-1/4 w-0.5 h-0.5 bg-yellow-400/70 rounded-full animate-particle-2 shadow-glow-sm ${
            isHovered ? "opacity-90" : "opacity-70"
          }`}
        ></div>
        <div
          className={`absolute bottom-1 left-2/5 w-0.5 h-0.5 bg-yellow-400/70 rounded-full animate-particle-3 shadow-glow-sm ${
            isHovered ? "opacity-90" : "opacity-70"
          }`}
        ></div>
        <div
          className={`absolute top-1/3 right-1/5 w-0.5 h-0.5 bg-yellow-400/70 rounded-full animate-particle-5 shadow-glow-sm ${
            isHovered ? "opacity-90" : "opacity-70"
          }`}
        ></div>

        {/* Звезды на заднем плане - всегда видны */}
        <div className="absolute -right-2 top-0 w-0.5 h-0.5 bg-white/80 rounded-full animate-pulse"></div>
        <div className="absolute right-1/3 -top-1 w-0.5 h-0.5 bg-white/80 rounded-full animate-pulse"></div>
        <div className="absolute right-1/2 bottom-0 w-0.5 h-0.5 bg-white/80 rounded-full animate-pulse"></div>

        {/* Дополнительные звезды при наведении */}
        {isHovered && (
          <>
            <div className="absolute left-1/5 -top-1 w-0.5 h-0.5 bg-white/80 rounded-full animate-pulse"></div>
            <div className="absolute right-1/4 bottom-1 w-0.5 h-0.5 bg-white/80 rounded-full animate-pulse"></div>
          </>
        )}

        {/* Горизонтальная светящаяся линия под "PLANET" */}
        <div
          className={`absolute bottom-0 left-[calc(100%*0.18)] h-[1px] bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent transition-all duration-500 ${
            isHovered
              ? "w-[60px] opacity-90 animate-light-ray-1 shadow-glow-sm"
              : "w-[50px] opacity-50"
          }`}
        ></div>

        {/* HD индикатор */}
        <div className="absolute -top-0.5 -right-1 flex items-center justify-center">
          <div
            className={`relative w-1.5 h-1.5 rounded-full bg-yellow-500/90 transition-all duration-300 ${
              isHovered
                ? "scale-150 shadow-glow-md"
                : "scale-100 shadow-glow-sm animate-pulse"
            }`}
          >
            {isHovered && (
              <div className="absolute inset-0 rounded-full bg-yellow-400 blur-sm opacity-70 animate-ping-slow"></div>
            )}
          </div>
        </div>

        {/* "4K" индикатор при наведении */}
        {isHovered && (
          <div className="absolute bottom-[-6px] right-0 text-xs font-bold text-yellow-400 tracking-tighter animate-pulse-slow">
            <span className="relative z-10">4K</span>
            <span className="absolute inset-0 text-yellow-500 blur-[1px] animate-pulse opacity-70 z-0"></span>
            <span className="absolute -inset-1 bg-gradient-to-r from-yellow-500/30 to-yellow-400/30 rounded-sm blur-sm"></span>
          </div>
        )}

        {/* Дополнительное свечение при наведении */}
        {isHovered && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-yellow-400/5 to-yellow-500/10 animate-glow-pulse rounded-lg blur-md"></div>
            <div className="absolute -inset-1 bg-gradient-to-b from-yellow-500/5 via-transparent to-yellow-500/5 animate-pulse-slow rounded-lg blur-lg"></div>
          </>
        )}
      </div>
    </div>
  );
};

// Компонент AI эффекта для логотипа КиноПортал
const AIPortalLogo = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Эффект анимации при монтировании
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="relative font-bold text-2xl py-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Базовый слой текста */}
      <div
        className={`flex items-center relative z-10 transition-all duration-500 ${
          isHovered ? "scale-105 translate-y-[1px]" : ""
        } ${isAnimating ? "animate-text-shimmer" : ""}`}
      >
        <span
          className={`relative text-white transition-colors duration-300 ${
            isHovered ? "text-white" : ""
          }`}
        >
          Кино
          {isHovered && (
            <span className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer rounded-sm blur-[1px] -z-10" />
          )}
        </span>
        <span
          className={`relative text-yellow-400 transition-all duration-300 ${
            isHovered ? "text-yellow-300 tracking-wide" : ""
          }`}
        >
          Портал
          {isHovered && (
            <span className="absolute -inset-1 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent animate-shimmer rounded-sm blur-[1px] -z-10" />
          )}
        </span>
      </div>

      {/* Основное свечение вокруг текста */}
      <div
        className={`absolute inset-0 -z-10 bg-gradient-to-r from-yellow-500/5 to-yellow-600/10 rounded-2xl blur-xl w-full h-full transition-opacity duration-500 ${
          isHovered ? "opacity-100 scale-110" : "opacity-0 scale-100"
        }`}
      ></div>

      {/* AI эффекты: частицы и свечение */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        {/* Фоновое свечение для текста */}
        <div
          className={`absolute inset-0 w-full h-full blur-sm transition-all duration-300 ${
            isHovered ? "opacity-70 scale-105" : "opacity-40 scale-100"
          }`}
        >
          <span
            className={`absolute text-yellow-200/20 font-bold text-2xl transition-all duration-500 ${
              isHovered
                ? "animate-pulse-slow transform rotate-1 translate-y-[0.5px]"
                : "animate-pulse transform rotate-1"
            }`}
          >
            Кино
          </span>
          <span
            className={`absolute left-[calc(100%*0.28)] text-yellow-400/40 font-bold text-2xl transition-all duration-500 ${
              isHovered
                ? "animate-pulse-slow transform -rotate-1 translate-y-[-0.5px]"
                : "animate-pulse transform -rotate-1"
            }`}
          >
            Портал
          </span>
        </div>

        {/* Частицы вокруг текста - видны всегда */}
        <div
          className={`absolute top-0 left-1/3 w-1 h-1 bg-yellow-400/70 rounded-full animate-particle-1 shadow-glow-sm ${
            isHovered ? "opacity-90" : "opacity-70"
          }`}
        ></div>
        <div
          className={`absolute top-1/2 right-4 w-1 h-1 bg-yellow-400/70 rounded-full animate-particle-2 shadow-glow-sm ${
            isHovered ? "opacity-90" : "opacity-70"
          }`}
        ></div>
        <div
          className={`absolute bottom-0 left-1/2 w-1 h-1 bg-yellow-400/70 rounded-full animate-particle-3 shadow-glow-sm ${
            isHovered ? "opacity-90" : "opacity-70"
          }`}
        ></div>

        {/* Частицы, которые появляются при наведении */}
        <div
          className={`absolute bottom-1/2 right-1/4 w-0.5 h-0.5 bg-yellow-300/60 rounded-full animate-particle-4 transition-all duration-300 ${
            isHovered ? "opacity-100 w-1 h-1 shadow-glow-sm" : "opacity-50"
          }`}
        ></div>
        <div
          className={`absolute top-1/3 left-1/4 w-0.5 h-0.5 bg-yellow-300/60 rounded-full animate-particle-5 transition-all duration-300 ${
            isHovered ? "opacity-100 w-1 h-1 shadow-glow-sm" : "opacity-50"
          }`}
        ></div>
        <div
          className={`absolute bottom-1/4 right-1/3 w-0.5 h-0.5 bg-yellow-300/60 rounded-full animate-particle-6 transition-all duration-300 ${
            isHovered ? "opacity-100 w-1 h-1 shadow-glow-sm" : "opacity-50"
          }`}
        ></div>

        {/* Микрочастицы - часть видна всегда, больше при наведении */}
        <div
          className={`absolute top-1/5 left-2/3 w-0.5 h-0.5 bg-yellow-200/70 rounded-full animate-micro-particle-1 transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-60"
          }`}
        ></div>
        <div
          className={`absolute bottom-1/4 right-1/4 w-0.5 h-0.5 bg-yellow-200/70 rounded-full animate-micro-particle-2 transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-60"
          }`}
        ></div>

        {/* Дополнительные микрочастицы - появляются только при наведении */}
        {isHovered && (
          <>
            <div className="absolute top-3/4 left-3/4 w-0.5 h-0.5 bg-yellow-200/70 rounded-full animate-micro-particle-3 shadow-glow-xs"></div>
            <div className="absolute top-1/4 right-1/2 w-0.5 h-0.5 bg-yellow-200/70 rounded-full animate-micro-particle-4 shadow-glow-xs"></div>
            <div className="absolute bottom-1/3 left-1/4 w-0.5 h-0.5 bg-yellow-200/70 rounded-full animate-micro-particle-5 shadow-glow-xs"></div>
            <div className="absolute bottom-1/2 right-1/5 w-0.5 h-0.5 bg-yellow-200/70 rounded-full animate-micro-particle-1 delay-100 shadow-glow-xs"></div>
            <div className="absolute top-1/5 left-2/3 w-0.5 h-0.5 bg-yellow-200/70 rounded-full animate-micro-particle-3 delay-200 shadow-glow-xs"></div>
          </>
        )}

        {/* Горизонтальная светящаяся линия под "Портал" */}
        <div
          className={`absolute bottom-0 left-[calc(100%*0.28)] h-[1px] bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent transition-all duration-500 ${
            isHovered
              ? "w-[80px] opacity-90 animate-light-ray-1 shadow-glow-xs"
              : "w-[72px] opacity-50"
          }`}
        ></div>

        {/* "AI" индикатор с пульсацией и свечением */}
        <div className="absolute -top-1 -right-1 flex items-center justify-center">
          <div
            className={`relative w-1.5 h-1.5 rounded-full bg-yellow-500/90 transition-all duration-300 ${
              isHovered
                ? "scale-150 shadow-glow-md"
                : "scale-100 shadow-glow-sm animate-pulse"
            }`}
          >
            {isHovered && (
              <div className="absolute inset-0 rounded-full bg-yellow-400 blur-sm opacity-70 animate-ping-slow"></div>
            )}
          </div>
        </div>

        {/* Декоративные диагональные линии - видны только при наведении */}
        {isHovered && (
          <>
            <div className="absolute bottom-0 left-0 w-[40px] h-[1px] bg-gradient-to-r from-yellow-500/40 to-transparent transform rotate-45 origin-bottom-left"></div>
            <div className="absolute top-1 right-0 w-[30px] h-[1px] bg-gradient-to-l from-yellow-500/40 to-transparent transform -rotate-45 origin-top-right"></div>
          </>
        )}

        {/* Дополнительное свечение при наведении */}
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-yellow-400/3 to-yellow-500/5 animate-glow-pulse rounded-lg blur-md"></div>
        )}
      </div>
    </div>
  );
};

// Компонент AI-ссылки для навигации с эффектом
interface AINavigationLinkProps {
  href: string;
  label: string;
  isActive: boolean;
  icon?: React.ReactNode;
}

const AINavigationLink = ({
  href,
  label,
  isActive,
  icon = null,
}: AINavigationLinkProps) => {
  const router = useRouter();

  // Специальная обработка для ссылки на актеров
  const isActorsLink = href === "/actors";
  // Специальная обработка для ссылки на медиатеку/watchlist
  const isWatchlistLink = href === "/watchlist";

  const handleClick = (e: React.MouseEvent) => {
    if (isActorsLink) {
      e.preventDefault();
      playSound("choose.mp3");
      router.push(href);
    } else {
      playSound("choose.mp3");
    }
  };

  return (
    <div className="relative overflow-visible">
      <Link
        href={href}
        className={`relative z-10 flex items-center gap-2 font-bebas-neue text-base uppercase tracking-wider transition-colors px-2 py-1.5 text-white hover:text-yellow-400 cursor-pointer overflow-visible group`}
        onClick={handleClick}
        prefetch={!isActorsLink}
      >
        {icon && <span className="z-10">{icon}</span>}
        <span className="z-10">{label}</span>
      </Link>

      {/* AI эффект, видимый только для активного пункта - вынесен из ссылки для увеличения области */}
      {isActive && (
        <div className="absolute inset-x-0 bottom-0 -z-0 pointer-events-none overflow-visible h-[200%]">
          {/* Основное свечение снизу вверх */}
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-yellow-500/20 via-yellow-500/10 to-transparent rounded-b-md blur-sm"></div>

          {/* Яркое свечение у самого низа */}
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-500/70 to-transparent shadow-glow-sm"></div>

          {/* Восходящие частицы - концентрируются внизу */}
          <div className="absolute bottom-0 left-1/4 w-0.5 h-0.5 bg-yellow-300/70 rounded-full animate-float-up-1"></div>
          <div className="absolute bottom-0 left-1/2 w-0.5 h-0.5 bg-yellow-300/70 rounded-full animate-float-up-2"></div>
          <div className="absolute bottom-0 right-1/4 w-0.5 h-0.5 bg-yellow-300/70 rounded-full animate-float-up-3"></div>

          {/* Дополнительные частицы - поднимаются с разной скоростью */}
          <div className="absolute bottom-1 left-[10%] w-0.5 h-0.5 bg-yellow-200/60 rounded-full animate-float-up-4"></div>
          <div className="absolute bottom-1 right-[15%] w-0.5 h-0.5 bg-yellow-200/60 rounded-full animate-float-up-5"></div>
          <div className="absolute bottom-0.5 left-[35%] w-0.5 h-0.5 bg-yellow-200/50 rounded-full animate-float-up-2"></div>
          <div className="absolute bottom-0.5 right-[40%] w-0.5 h-0.5 bg-yellow-200/50 rounded-full animate-float-up-3"></div>

          {/* Вертикальные лучи света, восходящие вверх */}
          <div className="absolute bottom-0 left-1/3 w-[1px] h-8 bg-gradient-to-t from-yellow-500/40 to-transparent"></div>
          <div className="absolute bottom-0 right-1/3 w-[1px] h-7 bg-gradient-to-t from-yellow-500/40 to-transparent"></div>
          <div className="absolute bottom-0 left-2/3 w-[1px] h-9 bg-gradient-to-t from-yellow-500/40 to-transparent"></div>

          {/* Микрочастицы - уже дошедшие до середины и выше */}
          <div className="absolute bottom-2/3 left-[20%] w-0.5 h-0.5 bg-yellow-300/50 rounded-full animate-micro-particle-1 shadow-glow-xs"></div>
          <div className="absolute bottom-[60%] right-[25%] w-0.5 h-0.5 bg-yellow-300/50 rounded-full animate-micro-particle-2 shadow-glow-xs"></div>
          <div className="absolute bottom-[75%] left-[45%] w-0.5 h-0.5 bg-yellow-200/40 rounded-full animate-micro-particle-4 shadow-glow-xs"></div>

          {/* Новые микрочастицы в верхней части */}
          <div className="absolute bottom-[85%] right-[35%] w-0.5 h-0.5 bg-yellow-200/40 rounded-full animate-micro-particle-3 shadow-glow-xs"></div>
          <div className="absolute bottom-[90%] left-[30%] w-0.5 h-0.5 bg-yellow-200/30 rounded-full animate-micro-particle-5 shadow-glow-xs"></div>
        </div>
      )}

      {/* Эффект при наведении для неактивных пунктов - вынесен из ссылки */}
      {!isActive && (
        <div className="absolute inset-x-0 bottom-0 -z-0 pointer-events-none opacity-0 group-hover:opacity-50 transition-opacity duration-300 overflow-visible h-8">
          {/* Свечение снизу при наведении */}
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent"></div>

          {/* Лёгкое свечение вверх при наведении */}
          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-yellow-500/10 to-transparent blur-sm"></div>

          {/* Микрочастицы при наведении - снизу вверх */}
          <div className="absolute bottom-0 left-1/3 w-0.5 h-0.5 bg-yellow-300/40 rounded-full animate-float-up-slow-1"></div>
          <div className="absolute bottom-0 right-1/3 w-0.5 h-0.5 bg-yellow-300/40 rounded-full animate-float-up-slow-2"></div>
        </div>
      )}
    </div>
  );
};

// Динамический импорт компонента с алфавитным списком актеров
const DynamicActorsAlphabetical = dynamic(
  () => import("@/components/actors-alphabetical"),
  {
    loading: () => (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    ),
    ssr: false,
  }
);

export default function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { username, setUsername, isLoaded } = useUsername();
  const [headerStyle, setHeaderStyle] = useState({});
  const [isScrolled, setIsScrolled] = useState(false);
  const [showDiscoverPopover, setShowDiscoverPopover] = useState(false);
  const [isDiscoverPopoverClosing, setIsDiscoverPopoverClosing] =
    useState(false);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const discoverRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const popoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [userInitial, setUserInitial] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const [mounted, setMounted] = useState(false);
  const profileId = useId();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Состояние для мобильного меню
  const [navIsReady, setNavIsReady] = useState(false); // Новое состояние для контроля видимости навигации

  const [movieLogo, setMovieLogo] = useState<string | null>(null);
  const [movieTitle, setMovieTitle] = useState<string | null>(null);
  const [nameInitial, setNameInitial] = useState<string | null>(null); // Оставляем для иконки профиля
  const [showActorsPopover, setShowActorsPopover] = useState(false);
  const [isActorsPopoverClosing, setIsActorsPopoverClosing] = useState(false);
  const actorsPopoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Внутри компонента Header, добавим состояние для индикации загрузки лого
  const [loadingMovieLogo, setLoadingMovieLogo] = useState(false);
  // Определяем, находимся ли мы на странице фильма
  const isMoviePage = pathname.startsWith("/movie/");

  // Обновляем useEffect для установки начальной буквы имени
  useEffect(() => {
    // Отмечаем, что компонент смонтирован
    setMounted(true);

    // Устанавливаем инициал из имени пользователя в контексте только если данные загружены с клиента
    if (isLoaded) {
      if (username && username.length > 0) {
        setNameInitial(username.charAt(0).toUpperCase());
        setTempUsername(username); // Инициализируем временное имя для редактирования
        setShowNameModal(false);
      } else {
        setNameInitial(null);
        // Не показываем встроенное модальное окно, так как теперь используется welcome-modal
        // setShowNameModal(true);  // Эту строку закомментировали
      }
    }
  }, [username, isLoaded]);

  // Обработчик прокрутки страницы
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Жанры фильмов для popover
  const genres = [
    { id: 28, name: "Боевик" },
    { id: 12, name: "Приключения" },
    { id: 16, name: "Мультфильм" },
    { id: 35, name: "Комедия" },
    { id: 80, name: "Криминал" },
    { id: 99, name: "Документальный" },
    { id: 18, name: "Драма" },
    { id: 10751, name: "Семейный" },
    { id: 14, name: "Фэнтези" },
    { id: 36, name: "История" },
    { id: 27, name: "Ужасы" },
    { id: 10402, name: "Музыка" },
    { id: 9648, name: "Детектив" },
    { id: 10749, name: "Мелодрама" },
    { id: 878, name: "Фантастика" },
    { id: 53, name: "Триллер" },
    { id: 10752, name: "Военный" },
    { id: 37, name: "Вестерн" },
  ];

  // Список популярных лет для фильтрации
  const years = [
    "2025",
    "2024",
    "2023",
    "2022",
    "2021",
    "2020",
    "2019",
    "2018",
    "2017",
    "2016",
    "2015",
    "2014",
    "2013",
    "2012",
    "2011",
    "2010",
    "2009",
    "2008",
    "2007",
    "2006",
    "2005",
    "2004",
    "2003",
    "2002",
    "2001",
    "2000",
  ];

  // Список популярных стран для фильтрации
  const countries = [
    { code: "RU", name: "Россия" },
    { code: "US", name: "США" },
    { code: "GB", name: "Великобритания" },
    { code: "FR", name: "Франция" },
    { code: "DE", name: "Германия" },
    { code: "IT", name: "Италия" },
    { code: "JP", name: "Япония" },
    { code: "KR", name: "Южная Корея" },
    { code: "IN", name: "Индия" },
    { code: "ES", name: "Испания" },
  ];

  // Инициализация выбранных фильтров из URL при открытии поповера
  useEffect(() => {
    if (showDiscoverPopover) {
      // Для жанров
      const genresParam = searchParams.get("with_genres");
      if (genresParam) {
        setSelectedGenres(genresParam.split(",").map((id) => parseInt(id, 10)));
      } else {
        setSelectedGenres([]);
      }

      // Для года
      const yearParam = searchParams.get("year");
      setSelectedYear(yearParam || "");

      // Для страны
      const countryParam = searchParams.get("with_origin_country");
      setSelectedCountry(countryParam || "");
    }
  }, [showDiscoverPopover, searchParams]);

  // Функции для управления поповером с задержкой
  const handleShowPopover = () => {
    if (popoverTimeoutRef.current) {
      clearTimeout(popoverTimeoutRef.current);
      popoverTimeoutRef.current = null;
    }
    setIsDiscoverPopoverClosing(false);
    setShowDiscoverPopover(true);
  };

  const handleHidePopover = () => {
    // Запускаем анимацию закрытия
    setIsDiscoverPopoverClosing(true);

    // Удаляем узел из DOM после завершения анимации
    popoverTimeoutRef.current = setTimeout(() => {
      setShowDiscoverPopover(false);
      setIsDiscoverPopoverClosing(false);
    }, 300); // Время должно совпадать с продолжительностью анимации
  };

  // Функция для закрытия поповера по клику в затемненной области
  const closeDiscoverPopover = () => {
    handleHidePopover();
  };

  // Обработчик для закрытия popover при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        discoverRef.current &&
        !discoverRef.current.contains(event.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setShowDiscoverPopover(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Очистка таймера при размонтировании компонента
  useEffect(() => {
    return () => {
      if (popoverTimeoutRef.current) {
        clearTimeout(popoverTimeoutRef.current);
      }
    };
  }, []);

  // Функция для переключения выбора жанра с автоматическим применением при пустом выборе
  const toggleGenre = (genreId: number) => {
    setSelectedGenres((prev) => {
      let newSelectedGenres;

      if (prev.includes(genreId)) {
        // Удаляем жанр из выбранных
        newSelectedGenres = prev.filter((id) => id !== genreId);
      } else {
        // Добавляем жанр к выбранным
        newSelectedGenres = [...prev, genreId];
      }

      // Если все жанры были сняты, автоматически применяем фильтры
      if (newSelectedGenres.length === 0 && prev.length > 0) {
        // Откладываем выполнение, чтобы состояние успело обновиться
        setTimeout(() => {
          const params = new URLSearchParams(searchParams.toString());
          params.delete("with_genres");
          router.push(`/discover?${params.toString()}`);
        }, 0);
      }

      return newSelectedGenres;
    });
  };

  // Модифицируем функцию очистки года, чтобы она сразу применяла фильтры и возвращала в исходное состояние
  const clearYearFilter = () => {
    setSelectedYear("");

    // Перенаправляем на базовый URL обзора без фильтров
    router.push("/discover");

    // Закрываем поповер
    setShowDiscoverPopover(false);
  };

  // Функция для очистки фильтра по стране
  const clearCountryFilter = () => {
    setSelectedCountry("");

    // Перенаправляем на базовый URL обзора без фильтров
    router.push("/discover");

    // Закрываем поповер
    setShowDiscoverPopover(false);
  };

  // Функция для очистки выбранных жанров
  const clearGenres = () => {
    // Очищаем выбранные жанры
    setSelectedGenres([]);

    // Перенаправляем на базовый URL обзора без фильтров
    router.push("/discover");

    // Закрываем поповер
    setShowDiscoverPopover(false);
  };

  // Добавим определение isMoviePage на основе текущего пути
  // Переменная уже объявлена выше

  // Эффект для обновления стиля хедера при изменении цветов
  useEffect(() => {
    if (isMoviePage) {
      // Устанавливаем только transition без фона
      setHeaderStyle({
        transition: "background-color 0.5s ease-in-out",
      });
    } else {
      // На других страницах используем стандартный цвет
      setHeaderStyle({});
    }
  }, [isMoviePage]);

  // Добавляем эффект для отслеживания изменений полноэкранного режима
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, []);

  // Функция для переключения полноэкранного режима
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      // Вход в полноэкранный режим
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(
          `Ошибка при переходе в полноэкранный режим: ${err.message}`
        );
      });
    } else {
      // Выход из полноэкранного режима
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Обновляем функцию сохранения имени
  function saveUsername(name: string) {
    if (name.trim().length > 0) {
      setUsername(name);
      setShowNameModal(false);
    }
  }

  // Создаем эффект для скрытия временного элемента после загрузки
  useEffect(() => {
    if (mounted) {
      // Добавляем небольшую задержку для плавности
      const timer = setTimeout(() => {
        const placeholderEl = document.getElementById(
          `profile-placeholder-${profileId}`
        );
        const contentEl = document.getElementById(
          `profile-content-${profileId}`
        );

        if (placeholderEl) {
          placeholderEl.style.display = "none";
        }

        if (contentEl) {
          contentEl.style.opacity = "1";
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [mounted, profileId]);

  // Восстанавливаем состояние для времени
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Восстанавливаем эффект для обновления времени
  useEffect(() => {
    // Устанавливаем интервал обновления времени
    const intervalId = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Восстанавливаем функцию форматирования времени
  const formatDateTime = (date: Date) => {
    // Массивы для месяцев и дней недели на русском
    const months = [
      "января",
      "февраля",
      "марта",
      "апреля",
      "мая",
      "июня",
      "июля",
      "августа",
      "сентября",
      "октября",
      "ноября",
      "декабря",
    ];

    const weekdays = [
      "Воскресенье",
      "Понедельник",
      "Вторник",
      "Среда",
      "Четверг",
      "Пятница",
      "Суббота",
    ];

    // Время
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    // Дата
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    // День недели
    const weekday = weekdays[date.getDay()];

    // Возвращаем объект со всеми компонентами для удобного форматирования
    return {
      time: `${hours}:${minutes}`,
      date: `${day} ${month} ${year}`,
      weekday: weekday,
    };
  };

  // Добавляем эффект для прослушивания события с лого фильма
  useEffect(() => {
    // Функция обработчик события
    const handleMovieLogo = (event: CustomEvent) => {
      const { logoPath, movieTitle, loading } = event.detail;
      console.log(
        "Получено лого фильма:",
        logoPath,
        movieTitle,
        loading ? "(загрузка)" : ""
      );

      // Устанавливаем состояние загрузки
      setLoadingMovieLogo(loading === true);

      // Если не в состоянии загрузки или есть лого, обновляем данные
      if (!loading || logoPath) {
        setMovieLogo(logoPath);
        setMovieTitle(movieTitle);
      }
    };

    // Регистрируем обработчик
    document.addEventListener(
      "movieLogoChange",
      handleMovieLogo as EventListener
    );

    // Очищаем обработчик при размонтировании
    return () => {
      document.removeEventListener(
        "movieLogoChange",
        handleMovieLogo as EventListener
      );
    };
  }, []);

  // Функция для применения фильтров
  const applyFilters = (params: URLSearchParams) => {
    // Используем router.push вместо window.location.href для клиентской навигации
    router.push(`/discover?${params.toString()}`);
    setShowDiscoverPopover(false);
  };

  const handleYearSelection = (year: string) => {
    setSelectedYear(selectedYear === year ? "" : year);
  };

  // Изменю функцию для обработки выбора страны без немедленного применения фильтра
  const handleCountrySelection = (countryCode: string) => {
    const newCountry = selectedCountry === countryCode ? "" : countryCode;
    setSelectedCountry(newCountry);
  };

  // Функции для управления поповером актеров с задержкой
  const handleShowActorsPopover = () => {
    if (actorsPopoverTimeoutRef.current) {
      clearTimeout(actorsPopoverTimeoutRef.current);
      actorsPopoverTimeoutRef.current = null;
    }
    setIsActorsPopoverClosing(false);
    setShowActorsPopover(true);
  };

  const handleHideActorsPopover = () => {
    // Запускаем анимацию закрытия
    setIsActorsPopoverClosing(true);

    // Удаляем узел из DOM после завершения анимации
    actorsPopoverTimeoutRef.current = setTimeout(() => {
      setShowActorsPopover(false);
      setIsActorsPopoverClosing(false);
    }, 300); // Время должно совпадать с продолжительностью анимации
  };

  // Функция для переключения мобильного меню
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    playSound(isMobileMenuOpen ? "menu_close.mp3" : "menu_open.mp3");
  };

  // Функция для закрытия мобильного меню (например, при клике на ссылку)
  const closeMobileMenu = () => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
      playSound("menu_close.mp3");
    }
  };

  // Добавляем эффект для закрытия меню при изменении маршрута
  useEffect(() => {
    closeMobileMenu();
  }, [pathname, searchParams]);

  // Добавляем эффект для установки готовности навигации
  useEffect(() => {
    // При начальной загрузке сразу устанавливаем навигацию как готовую
    // чтобы пункты меню отображались сразу без fade-in эффекта
    setNavIsReady(true);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${
        // Увеличиваем z-index до 60
        isScrolled ? "bg-zinc-900 shadow-lg" : "bg-black/0"
      }`}
      style={headerStyle}
    >
      {/* Добавляем контейнер-обертку для flex на мобильных */}
      <div className="container-fluid mx-auto py-3 px-4 md:py-4 md:px-6">
        {" "}
        {/* Уменьшаем padding на мобильных */}
        <div className="flex items-center justify-between w-full gap-4">
          {" "}
          {/* Добавляем gap */}
          {/* Левая часть с логотипом + ДЕСКТОПНАЯ навигация */}
          <div className="flex items-center flex-shrink-0">
            {" "}
            {/* Лого + десктоп-нав не должны сжиматься */}
            {/* Логотип */}
            {isMoviePage ? (
              <div className="h-auto flex items-center md:mr-10">
                {" "}
                {/* Убираем отступ справа на мобильных */}
                {movieLogo ? (
                  <img
                    src={getImageUrl(movieLogo, "w300")}
                    alt={movieTitle || "Лого фильма"}
                    className="h-8 object-contain max-w-[180px]"
                    onClick={() => router.push("/")}
                    style={{ cursor: "pointer" }}
                  />
                ) : (
                  <Link href="/" className="cursor-pointer">
                    <HDPlanetLogo />
                  </Link>
                )}
              </div>
            ) : (
              <Link href="/" className="mr-10 cursor-pointer">
                <HDPlanetLogo />
              </Link>
            )}
            {/* Основная ДЕСКТОПНАЯ навигация - СКРЫТА на мобильных */}
            {/* Возвращаем SearchBar сюда */}
            <nav className="hidden md:flex items-center gap-6 ml-10">
              {" "}
              {/* Добавил ml-10 для отступа от лого */}
              <AINavigationLink
                href="/"
                label="Главная"
                isActive={pathname === "/"}
              />
              <AINavigationLink
                href="/keywords"
                label="Коллекции"
                isActive={
                  pathname === "/keywords" || pathname.startsWith("/keywords/")
                }
              />
              {/* ===== ВОССТАНАВЛИВАЕМ Актеры ===== */}
              <div className="relative">
                <div className="flex items-center">
                  <AINavigationLink
                    href="/actors"
                    label="Актеры"
                    isActive={
                      pathname === "/actors" || pathname.startsWith("/actors/")
                    }
                  />
                  <button
                    onClick={handleShowActorsPopover}
                    className="ml-1 w-5 h-5 rounded-full bg-yellow-500 hover:bg-gray-400 flex items-center justify-center transition-colors group"
                    aria-label="Поиск актеров"
                  >
                    {/* ... svg иконка плюса ... */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-black group-hover:text-black transition-colors"
                    >
                      <path d="M5 12h14" />
                      <path d="M12 5v14" />
                    </svg>
                  </button>
                </div>
                {/* Всплывающее меню актеров по алфавиту */}
                {showActorsPopover && (
                  <>
                    {/* Оверлей */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={handleHideActorsPopover}
                    ></div>
                    {/* Поповер */}
                    <div
                      className={`absolute top-full left-0 mt-4 w-[600px] overflow-hidden z-50 border ${
                        isActorsPopoverClosing
                          ? "animate-slideUp"
                          : "animate-slideDown"
                      }`}
                      style={{
                        boxShadow:
                          "0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 0 5px rgba(255, 200, 0, 0.1)",
                        backdropFilter: "blur(5px)",
                        backgroundColor: "rgb(38 38 38)",
                        borderColor: "rgb(87 87 87 / 50%)",
                      }}
                    >
                      <div className="py-3 px-4 border-b border-gray-800">
                        <h3 className="text-white text-sm font-bold">
                          Поиск актеров
                        </h3>
                      </div>
                      <div className="relative">
                        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-yellow-500/5 blur-3xl pointer-events-none"></div>
                        <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-yellow-500/5 blur-3xl pointer-events-none"></div>
                        <DynamicActorsAlphabetical />
                      </div>
                    </div>
                  </>
                )}
              </div>
              {/* ==================================== */}
              {/* ===== Обзор - используем AINavigationLink ===== */}
              <div ref={discoverRef} className="relative">
                <div className="flex items-center">
                  {/* Используем AINavigationLink для единообразия */}
                  <AINavigationLink
                    href="/discover"
                    label="ОБЗОР"
                    isActive={pathname === "/discover"}
                    icon={<Compass className="w-4 h-4" />}
                  />
                  {/* Кнопка поповера остается отдельной */}
                  <button
                    onClick={(e) => {
                      e.preventDefault(); // Оставляем здесь, т.к. это button
                      if (showDiscoverPopover) {
                        handleHidePopover();
                      } else {
                        handleShowPopover();
                      }
                    }}
                    className="ml-1 w-5 h-5 rounded-full bg-yellow-500 hover:bg-gray-400 flex items-center justify-center transition-colors group"
                    aria-label="Фильтры обзора"
                  >
                    {/* ... svg иконка стрелки ... */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-black group-hover:text-black transition-colors"
                    >
                      {showDiscoverPopover ? (
                        <polyline points="18 15 12 9 6 15" />
                      ) : (
                        <polyline points="6 9 12 15 18 9" />
                      )}
                    </svg>
                  </button>
                </div>
                {/* Popover для "Обзор" */}
                {showDiscoverPopover && (
                  <>
                    {/* Содержимое поповера Обзор - ВОССТАНАВЛИВАЕМ */}
                    <div
                      ref={popoverRef}
                      className={`absolute top-full left-0 mt-4 w-[680px] overflow-hidden z-50 border ${
                        isDiscoverPopoverClosing
                          ? "animate-slideUp"
                          : "animate-slideDown"
                      }`}
                      style={{
                        boxShadow:
                          "0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 0 5px rgba(255, 200, 0, 0.1)",
                        backdropFilter: "blur(5px)",
                        backgroundColor: "rgb(38 38 38)",
                        borderColor: "rgb(87 87 87 / 50%)",
                      }}
                    >
                      <div className="py-3 px-4 border-b border-gray-700/30">
                        <h3 className="text-white text-sm font-bold">
                          Фильтры
                        </h3>
                      </div>
                      {/* ВОССТАНАВЛИВАЕМ СОДЕРЖИМОЕ */}
                      <div className="relative grid grid-cols-12 gap-0 p-5">
                        {/* Фоновый декоративный элемент */}
                        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-yellow-500/5 blur-3xl pointer-events-none"></div>
                        <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-yellow-500/5 blur-3xl pointer-events-none"></div>

                        {/* Категории (левая колонка) */}
                        <div className="col-span-4 pr-4">
                          <h3 className="text-yellow-500 text-base uppercase font-bebas-neue tracking-wider mb-3 border-b border-yellow-500/30 pb-2">
                            Категории
                          </h3>
                          <ul className="space-y-2">
                            <li>
                              <button
                                onClick={() => {
                                  const params = new URLSearchParams();
                                  if (selectedGenres.length > 0) {
                                    params.set(
                                      "with_genres",
                                      selectedGenres.join(",")
                                    );
                                  }
                                  router.push(
                                    `/discover${
                                      params.toString()
                                        ? `?${params.toString()}`
                                        : ""
                                    }`
                                  );
                                  setShowDiscoverPopover(false);
                                }}
                                className="text-gray-300 hover:text-black transition-all duration-200 block w-full text-left py-2 px-3 rounded-lg hover:bg-yellow-500 text-sm flex items-center gap-2 group"
                              >
                                <span className="w-5 h-5 flex items-center justify-center text-gray-400 group-hover:text-black transition-colors">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-4 h-4"
                                  >
                                    <rect
                                      width="18"
                                      height="18"
                                      x="3"
                                      y="3"
                                      rx="2"
                                    />
                                    <path d="M9.5 15V9" />
                                    <path d="M14.5 9v6" />
                                  </svg>
                                </span>
                                <span>Все фильмы</span>
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() => {
                                  const params = new URLSearchParams();
                                  params.set("year", "2025");
                                  params.set("sort_by", "popularity.desc");
                                  if (selectedGenres.length > 0) {
                                    params.set(
                                      "with_genres",
                                      selectedGenres.join(",")
                                    );
                                  }
                                  router.push(`/discover?${params.toString()}`);
                                  setShowDiscoverPopover(false);
                                }}
                                className="text-gray-300 hover:text-black transition-all duration-200 block w-full text-left py-2 px-3 rounded-lg hover:bg-yellow-500 text-sm flex items-center gap-2 group"
                              >
                                <span className="w-5 h-5 flex items-center justify-center text-gray-400 group-hover:text-black transition-colors">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-4 h-4"
                                  >
                                    <path d="M12.5 3h-8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h15a2 2 0 0 0 2-2v-8.5" />
                                    <path d="M19.44 9 21 7.44a2 2 0 0 0 0-2.88l-1.56-1.56a2 2 0 0 0-2.88 0L15 4.56" />
                                    <path d="M18.39 8 9.5 16.89" />
                                    <path d="M12 22v-4" />
                                    <path d="M5 22v-2" />
                                    <path d="M8 22v-2" />
                                    <path d="M16 22v-2" />
                                  </svg>
                                </span>
                                <span>Новинки 2025</span>
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() => {
                                  Object.values(STORAGE_KEYS).forEach((key) => {
                                    sessionStorage.removeItem(key);
                                  });
                                  const params = new URLSearchParams();
                                  params.set("trending", "day");
                                  if (selectedGenres.length > 0) {
                                    params.set(
                                      "with_genres",
                                      selectedGenres.join(",")
                                    );
                                  }
                                  router.push(`/discover?${params.toString()}`);
                                  setShowDiscoverPopover(false);
                                }}
                                className="text-gray-300 hover:text-black transition-all duration-200 block w-full text-left py-2 px-3 rounded-lg hover:bg-yellow-500 text-sm flex items-center gap-2 group"
                              >
                                <span className="w-5 h-5 flex items-center justify-center text-gray-400 group-hover:text-black transition-colors">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-4 h-4"
                                  >
                                    <path d="M22 12 3 20l3.5-8.5L3 4l19 8Z" />
                                    <path d="M22 12H7" />
                                  </svg>
                                </span>
                                <span>Сейчас в тренде</span>
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() => {
                                  Object.values(STORAGE_KEYS).forEach((key) => {
                                    sessionStorage.removeItem(key);
                                  });
                                  const params = new URLSearchParams();
                                  params.set("trending", "week");
                                  if (selectedGenres.length > 0) {
                                    params.set(
                                      "with_genres",
                                      selectedGenres.join(",")
                                    );
                                  }
                                  router.push(`/discover?${params.toString()}`);
                                  setShowDiscoverPopover(false);
                                }}
                                className="text-gray-300 hover:text-black transition-all duration-200 block w-full text-left py-2 px-3 rounded-lg hover:bg-yellow-500 text-sm flex items-center gap-2 group"
                              >
                                <span className="w-5 h-5 flex items-center justify-center text-gray-400 group-hover:text-black transition-colors">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-4 h-4"
                                  >
                                    <path d="M12 2v4" />
                                    <path d="M12 18v4" />
                                    <path d="m4.93 4.93 2.83 2.83" />
                                    <path d="m16.24 16.24 2.83 2.83" />
                                    <path d="M2 12h4" />
                                    <path d="M18 12h4" />
                                    <path d="m4.93 19.07 2.83-2.83" />
                                    <path d="m16.24 7.76 2.83-2.83" />
                                  </svg>
                                </span>
                                <span>В тренде за неделю</span>
                              </button>
                            </li>
                          </ul>
                        </div>

                        {/* Разделитель */}
                        <div className="col-span-1 flex justify-center px-2">
                          <div className="w-px bg-gradient-to-b from-gray-700/30 via-yellow-500/20 to-gray-700/30 h-full opacity-70"></div>
                        </div>

                        {/* Жанры (правая колонка) */}
                        <div className="col-span-7 pl-4">
                          {/* Жанры */}
                          <div className="mb-5">
                            <div className="flex justify-between items-center mb-3 border-b border-yellow-500/30 pb-2">
                              <h3 className="text-yellow-500 text-base uppercase font-bebas-neue tracking-wider">
                                Жанры
                              </h3>
                              {selectedGenres.length > 0 && (
                                <button
                                  onClick={clearGenres}
                                  className="text-xs text-black flex items-center gap-1.5 transition-all duration-200 bg-yellow-500 px-2.5 py-1 rounded-full hover:bg-yellow-400 backdrop-blur-sm font-medium"
                                >
                                  <X className="w-2.5 h-2.5" />
                                  Очистить{" "}
                                  {selectedGenres.length > 1 &&
                                    `(${selectedGenres.length})`}
                                </button>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {genres.map((genre) => (
                                <button
                                  key={genre.id}
                                  onClick={() => toggleGenre(genre.id)}
                                  className={`px-2.5 py-1 rounded-full text-xs transition-all duration-200 ${
                                    selectedGenres.includes(genre.id)
                                      ? "bg-white text-black font-medium shadow-md"
                                      : "bg-transparent text-gray-300 hover:bg-white hover:text-black"
                                  }`}
                                >
                                  {genre.name}
                                </button>
                              ))}
                            </div>
                          </div>
                          {/* Годы */}
                          <div className="mb-5">
                            <div className="flex justify-between items-center mb-3 border-b border-yellow-500/30 pb-2">
                              <h3 className="text-yellow-500 text-base uppercase font-bebas-neue tracking-wider">
                                Год выпуска
                              </h3>
                              {selectedYear && (
                                <button
                                  onClick={clearYearFilter}
                                  className="text-xs text-black flex items-center gap-1.5 transition-all duration-200 bg-yellow-500 px-2.5 py-1 rounded-full hover:bg-yellow-400 backdrop-blur-sm font-medium"
                                >
                                  <X className="w-2.5 h-2.5" />
                                  Очистить
                                </button>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {years.map((year) => (
                                <button
                                  key={year}
                                  onClick={() => handleYearSelection(year)}
                                  className={`px-2.5 py-1 rounded-full text-xs transition-all duration-200 ${
                                    selectedYear === year
                                      ? "bg-white text-black font-medium shadow-md"
                                      : "bg-transparent text-gray-300 hover:bg-white hover:text-black"
                                  }`}
                                >
                                  {year}
                                </button>
                              ))}
                            </div>
                          </div>
                          {/* Страны */}
                          <div className="mb-5">
                            <div className="flex justify-between items-center mb-3 border-b border-yellow-500/30 pb-2">
                              <h3 className="text-yellow-500 text-base uppercase font-bebas-neue tracking-wider">
                                Страна
                              </h3>
                              {selectedCountry && (
                                <button
                                  onClick={clearCountryFilter}
                                  className="text-xs text-black flex items-center gap-1.5 transition-all duration-200 bg-yellow-500 px-2.5 py-1 rounded-full hover:bg-yellow-400 backdrop-blur-sm font-medium"
                                >
                                  <X className="w-2.5 h-2.5" />
                                  Очистить
                                </button>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {countries.map((country) => (
                                <button
                                  key={country.code}
                                  onClick={() =>
                                    handleCountrySelection(country.code)
                                  }
                                  className={`px-2.5 py-1 rounded-full text-xs transition-all duration-200 ${
                                    selectedCountry === country.code
                                      ? "bg-white text-black font-medium shadow-md"
                                      : "bg-transparent text-gray-300 hover:bg-white hover:text-black"
                                  }`}
                                >
                                  {country.name}
                                </button>
                              ))}
                            </div>
                          </div>
                          {/* Кнопка Применить */}
                          {(selectedGenres.length > 0 ||
                            selectedYear ||
                            selectedCountry) && (
                            <div className="mt-5 flex justify-center">
                              <button
                                onClick={() => {
                                  const params = new URLSearchParams();
                                  if (selectedGenres.length > 0) {
                                    params.set(
                                      "with_genres",
                                      selectedGenres.join(",")
                                    );
                                  }
                                  if (selectedYear) {
                                    params.set("year", selectedYear);
                                  }
                                  if (selectedCountry) {
                                    params.set(
                                      "with_origin_country",
                                      selectedCountry
                                    );
                                  }
                                  params.set("sort_by", "popularity.desc");
                                  params.set("t", Date.now().toString());
                                  Object.values(STORAGE_KEYS).forEach((key) => {
                                    sessionStorage.removeItem(key);
                                  });
                                  router.push(`/discover?${params.toString()}`);
                                  setShowDiscoverPopover(false);
                                }}
                                className="w-full px-4 py-3 bg-yellow-500 text-black rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:bg-yellow-400"
                              >
                                <span>Применить фильтры</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              {/* ============================== */}
              <AINavigationLink
                href="/watchlist"
                label="Медиатека"
                isActive={
                  pathname === "/watchlist" ||
                  pathname.startsWith("/watchlist/")
                }
              />
              {/* SearchBar теперь здесь */}
              <SearchBar />
            </nav>
          </div>
          {/* Правая часть с иконками */}
          <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
            {" "}
            {/* Иконки не должны сжиматься */}
            {/* Профиль (виден всегда) */}
            <div className="relative">
              <Link
                href="/profile"
                className="flex items-center text-gray-400 hover:text-yellow-400 transition-colors cursor-pointer"
                title={username ? `Профиль: ${username}` : "Профиль"}
                onClick={() => playSound("choose.mp3")}
              >
                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-black font-medium text-sm">
                  <div
                    id={`profile-content-${profileId}`}
                    className={`transition-opacity duration-300 ${
                      mounted ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {nameInitial || <User className="w-4 h-4" />}
                  </div>
                  {!mounted && (
                    <div
                      id={`profile-placeholder-${profileId}`}
                      className="animate-pulse"
                    >
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                </div>
              </Link>
            </div>
            {/* Время и дата - СКРЫТЫ на мобильных */}
            <div className="hidden md:flex items-center gap-3 text-white">
              <div className="text-lg flex items-center h-full">
                {formatDateTime(currentDateTime).time}
              </div>

              <div className="flex flex-col justify-center">
                <div className="text-xs leading-tight uppercase">
                  {formatDateTime(currentDateTime).date}
                </div>
                <div className="text-xs leading-tight uppercase">
                  {formatDateTime(currentDateTime).weekday}
                </div>
              </div>
            </div>
            {/* Разделитель - СКРЫТ на мобильных */}
            <div className="hidden md:block h-5 w-px bg-gray-700"></div>
            {/* Полноэкранный режим - ВИДЕН только на десктопе */}
            <div className="hidden md:block text-white text-sm">
              {isFullScreen ? (
                <button
                  onClick={toggleFullScreen}
                  className="hover:text-yellow-400 transition-colors"
                  title="Выйти из полноэкранного режима"
                >
                  <Shrink className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={toggleFullScreen}
                  className="hover:text-yellow-400 transition-colors"
                  title="Полноэкранный режим"
                >
                  <Expand className="w-4 h-4" />
                </button>
              )}
            </div>
            {/* Иконка Гамбургер-меню - ВИДНА только на мобильных */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="text-white hover:text-yellow-400 transition-colors p-1 -mr-1"
                aria-label="Открыть меню"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Мобильное меню (Off-canvas) */}
      {isMobileMenuOpen && (
        <>
          {/* Оверлей для закрытия */}
          <div
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm md:hidden"
            onClick={closeMobileMenu}
          ></div>

          {/* Сама панель меню */}
          <div
            className={`fixed inset-0 bg-gray-900/98 backdrop-blur-md z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
              isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Добавляем items-center justify-center для центрирования */}
            <div className="flex flex-col h-full p-5 items-center justify-center text-center">
              {/* Кнопка закрытия - позиционируем абсолютно в углу */}
              <div className="absolute top-5 right-5">
                <button
                  onClick={closeMobileMenu}
                  className="text-gray-400 hover:text-white transition-colors p-2" // Увеличил padding
                  aria-label="Закрыть меню"
                >
                  <X size={28} /> {/* Увеличил иконку */}
                </button>
              </div>

              {/* Поиск в мобильном меню - добавляем mx-auto для явного центрирования */}
              <div className="mb-10 px-4 max-w-sm mx-auto">
                {" "}
                {/* Добавил mx-auto */}
                <SearchBar />
              </div>

              {/* Ссылки меню */}
              {/* Добавляем text-center к nav */}
              <nav className="flex flex-col gap-5 text-center">
                {" "}
                {/* Увеличил gap */}
                {/* Увеличиваем шрифт и меняем стиль */}
                <Link
                  href="/"
                  onClick={closeMobileMenu}
                  className="text-white hover:text-yellow-400 transition-colors py-2 text-2xl font-semibold uppercase tracking-wider flex items-center justify-center gap-3"
                >
                  <Home size={22} /> Главная
                </Link>
                <Link
                  href="/keywords"
                  onClick={closeMobileMenu}
                  className="text-white hover:text-yellow-400 transition-colors py-2 text-2xl font-semibold uppercase tracking-wider flex items-center justify-center gap-3"
                >
                  <Bookmark size={22} /> Коллекции
                </Link>
                <Link
                  href="/actors"
                  onClick={closeMobileMenu}
                  className="text-white hover:text-yellow-400 transition-colors py-2 text-2xl font-semibold uppercase tracking-wider flex items-center justify-center gap-3"
                >
                  <User size={22} /> Актеры
                </Link>
                <Link
                  href="/discover"
                  onClick={closeMobileMenu}
                  className="text-white hover:text-yellow-400 transition-colors py-2 text-2xl font-semibold uppercase tracking-wider flex items-center justify-center gap-3"
                >
                  <Compass size={22} /> ОБЗОР
                </Link>
                <Link
                  href="/watchlist"
                  onClick={closeMobileMenu}
                  className="text-white hover:text-yellow-400 transition-colors py-2 text-2xl font-semibold uppercase tracking-wider flex items-center justify-center gap-3"
                >
                  <MonitorSmartphone size={22} /> Медиатека
                </Link>
              </nav>
            </div>
          </div>
        </>
      )}

      {/* Модальное окно для ввода имени - оставляем без изменений */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full border border-gray-700 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-white font-bold">
                Изменить имя пользователя
              </h2>
              <button
                onClick={() => setShowNameModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-300 mb-4">Как к вам обращаться?</p>

            <input
              type="text"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              placeholder="Введите ваше имя"
              className="w-full p-3 bg-gray-800 text-white rounded-lg mb-4 border border-gray-700 focus:outline-none focus:border-yellow-500"
              autoFocus
            />

            <div className="flex justify-end">
              <button
                onClick={() => {
                  // Генерируем случайное имя
                  const russianNames = [
                    "Александр",
                    "Михаил",
                    "Иван",
                    "Дмитрий",
                    "Анна",
                    "Мария",
                    "Ольга",
                    "Екатерина",
                  ];
                  const randomName =
                    russianNames[
                      Math.floor(Math.random() * russianNames.length)
                    ];
                  // Используем setUsername из контекста
                  setUsername(randomName);
                  setShowNameModal(false);
                  playSound("cancel.mp3");
                }}
                className="px-4 py-2 text-gray-300 hover:text-yellow-400 mr-2"
              >
                Пропустить
              </button>
              <button
                onClick={() => {
                  saveUsername(tempUsername);
                  playSound("confirm.mp3");
                }}
                disabled={!tempUsername.trim()}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  tempUsername.trim()
                    ? "bg-yellow-500 hover:bg-yellow-600 text-black"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
