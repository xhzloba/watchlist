"use client";

import React, { RefObject } from "react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { List, Grid, Eye, X, Filter, LayoutList } from "lucide-react"; // Примерные иконки
import { STORAGE_KEYS } from "@/lib/constants";
import clsx from "clsx";

// Define PosterSize type here as well, or import from page.tsx if exported
type PosterSize = "small" | "medium" | "large";
// Define GapSize type
type GapSize = "m" | "l" | "xl";

// Define props interface
interface DiscoverFilterBarProps {
  posterSize: PosterSize;
  onSizeChange: (size: PosterSize) => void;
  gapSize: GapSize; // Add gapSize prop
  onGapChange: (gap: GapSize) => void; // Add onGapChange prop
  // Add refs and open handlers for popovers
  categoryTriggerRef: RefObject<HTMLButtonElement>;
  onOpenCategoryPopover: () => void;
  filterTriggerRef: RefObject<HTMLButtonElement>;
  onOpenFilterPopover: () => void;
}

// Данные для фильтров (перемещены сюда из Header)
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

// Update component signature to accept props
const DiscoverFilterBar: React.FC<DiscoverFilterBarProps> = ({
  posterSize,
  onSizeChange,
  gapSize, // Use from props
  onGapChange, // Use from props
  categoryTriggerRef, // Use from props
  onOpenCategoryPopover, // Use from props
  filterTriggerRef, // Use from props
  onOpenFilterPopover, // Use from props
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Состояние для контролов из картинки
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Инициализация состояний фильтров из URL
  useEffect(() => {
    const genresParam = searchParams.get("with_genres");
    const selectedGenres = genresParam
      ? genresParam.split(",").map((id) => parseInt(id, 10))
      : [];

    const yearParam = searchParams.get("year");
    const selectedYear = yearParam || "";

    const countryParam = searchParams.get("with_origin_country");
    const selectedCountry = countryParam || "";

    // Инициализация viewMode
    const viewParam = searchParams.get("view") as "grid" | "list" | null;
    if (viewParam && ["grid", "list"].includes(viewParam))
      setViewMode(viewParam);
  }, [searchParams]);

  // --- Логика управления поповером ФИЛЬТРОВ ---
  const openFilterPopover = onOpenFilterPopover;

  const closeFilterPopover = () => {
    // Implementation of closeFilterPopover
  };

  // --- Логика управления поповером КАТЕГОРИЙ ---
  const openCategoryPopover = onOpenCategoryPopover;

  const closeCategoryPopover = () => {
    // Implementation of closeCategoryPopover
  };

  // --- Эффект закрытия по клику снаружи (для обоих поповеров) ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close filter popover
      if (
        filterTriggerRef.current &&
        !filterTriggerRef.current.contains(event.target as Node)
      ) {
        if (onOpenFilterPopover) closeFilterPopover();
      }
      // Close category popover
      if (
        categoryTriggerRef.current &&
        !categoryTriggerRef.current.contains(event.target as Node)
      ) {
        if (onOpenCategoryPopover) closeCategoryPopover();
      }
    };

    // Add listener only if at least one popover is open
    if (onOpenFilterPopover || onOpenCategoryPopover) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    onOpenFilterPopover,
    onOpenCategoryPopover,
    closeFilterPopover,
    closeCategoryPopover,
  ]);

  // --- Функции для обновления URL с фильтрами ---
  const updateFiltersInUrl = (newParams: Record<string, string | null>) => {
    const current = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === "") {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    });

    // Всегда сбрасываем пагинацию и удаляем кеш при смене фильтров
    current.delete("page");
    Object.values(STORAGE_KEYS).forEach((key) => {
      sessionStorage.removeItem(key);
    });
    // Добавляем таймстемп для инвалидации кеша, если необходимо
    current.set("t", Date.now().toString());

    // Устанавливаем сортировку по популярности по умолчанию при фильтрации
    if (
      !current.has("sort_by") &&
      (current.has("with_genres") ||
        current.has("year") ||
        current.has("with_origin_country"))
    ) {
      current.set("sort_by", "popularity.desc");
    }

    router.push(`/discover?${current.toString()}`, { scroll: false });
    closeFilterPopover(); // Закрываем поповер после применения
  };

  // --- Обработчики для поповера фильтров ---
  const handleGenreToggle = (genreId: number) => {
    // Implementation of handleGenreToggle
  };

  const handleYearSelect = (year: string) => {
    // Implementation of handleYearSelect
  };

  const handleCountrySelect = (countryCode: string) => {
    // Implementation of handleCountrySelect
  };

  const handleClearGenres = () => {
    // Implementation of handleClearGenres
  };

  const handleClearYear = () => {
    // Implementation of handleClearYear
  };

  const handleClearCountry = () => {
    // Implementation of handleClearCountry
  };

  const handleApplyFilters = () => {
    updateFiltersInUrl({
      with_genres: selectedGenres.length > 0 ? selectedGenres.join(",") : null,
      year: selectedYear || null,
      with_origin_country: selectedCountry || null,
    });
  };

  // --- Обработчики для контролов в баре ---
  const handleViewChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    console.log("[DiscoverFilterBar] View mode changed to:", mode);
  };

  return (
    <div className="relative flex items-center justify-between bg-zinc-800/70 backdrop-blur-sm p-2 rounded-full shadow-md border border-zinc-700/50 mb-6">
      {/* Левая часть: Кнопка Категорий */}
      <div className="relative">
        <button
          ref={categoryTriggerRef} // Use category ref
          onClick={onOpenCategoryPopover} // Use category opener
          className="p-2 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors duration-200"
          aria-label="Открыть категории"
          aria-haspopup="true"
        >
          <LayoutList className="w-5 h-5" /> {/* Use LayoutList icon */}
        </button>
      </div>
      {/* Центральная часть: Режим отображения, Размер, Промежуток */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {" "}
        {/* Maybe remove flex-shrink-0 */}
        {/* Разделитель */}
        <div className="h-5 w-px bg-zinc-600/50 mx-2"></div>
        {/* Режим отображения */}
        <div className="flex items-center bg-zinc-700/60 p-1 rounded-full">
          <button
            onClick={() => handleViewChange("list")}
            className={clsx(
              "p-1.5 rounded-full transition-colors duration-200",
              viewMode === "list"
                ? "bg-yellow-500 text-black"
                : "text-zinc-400 hover:text-white"
            )}
            aria-label="Список"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleViewChange("grid")}
            className={clsx(
              "p-1.5 rounded-full transition-colors duration-200",
              viewMode === "grid"
                ? "bg-yellow-500 text-black"
                : "text-zinc-400 hover:text-white"
            )}
            aria-label="Сетка"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
        {/* Иконка глаза (пример) */}
        <button
          className="p-2 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors duration-200"
          aria-label="Видимость"
        >
          <Eye className="w-5 h-5" />
        </button>
        {/* Разделитель */}
        <div className="h-5 w-px bg-zinc-600/50 mx-2"></div>
        {/* Размер элементов */}
        <div className="flex items-center bg-zinc-700/60 p-1 rounded-full text-xs font-medium">
          {(["small", "medium", "large"] as const).map((size) => (
            <button
              key={size}
              // Вызываем onSizeChange from props
              onClick={() => onSizeChange(size)}
              className={clsx(
                "px-3 py-1 rounded-full transition-colors duration-200 min-w-[36px] text-center", // Added min-width and center text
                // Сравниваем с posterSize from props
                posterSize === size
                  ? "bg-yellow-500 text-black"
                  : "text-zinc-400 hover:text-white"
              )}
              // Меняем aria-label для соответствия новым значениям
              aria-label={`Размер ${
                size === "small"
                  ? "Мелкий"
                  : size === "medium"
                  ? "Средний"
                  : "Крупный"
              }`}
            >
              {/* Отображаем M, L, XL как раньше, но логика выбора основана на small, medium, large */}
              {size === "small" ? "M" : size === "medium" ? "L" : "XL"}
            </button>
          ))}
        </div>
        {/* Добавляем кнопки управления промежутком */}
        <div className="flex items-center bg-zinc-700/60 p-1 rounded-full text-xs font-medium">
          {(["m", "l", "xl"] as const).map((gap) => (
            <button
              key={gap}
              // Вызываем onGapChange from props
              onClick={() => onGapChange(gap)}
              className={clsx(
                "px-3 py-1 rounded-full transition-colors duration-200 min-w-[36px] text-center",
                // Сравниваем с gapSize from props
                gapSize === gap
                  ? "bg-yellow-500 text-black"
                  : "text-zinc-400 hover:text-white"
              )}
              aria-label={`Вертикальный промежуток ${gap.toUpperCase()}`}
            >
              {/* Отображаем M, L, XL */}
              {gap.toUpperCase()}
            </button>
          ))}
        </div>
        {/* Разделитель */}
        <div className="h-5 w-px bg-zinc-600/50 mx-2"></div>
      </div>
      {/* Правая часть: Кнопка Фильтров */}
      <div className="relative">
        <button
          ref={filterTriggerRef} // Use filter ref
          onClick={onOpenFilterPopover} // Use filter opener
          className="p-2 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors duration-200"
          aria-label="Открыть фильтры"
          aria-haspopup="true"
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default DiscoverFilterBar;
