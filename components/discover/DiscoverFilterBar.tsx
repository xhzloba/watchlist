"use client";

import React, { RefObject, useState, useEffect, useRef } from "react";
import { List, Grid, Filter, LayoutList } from "lucide-react"; // Removed Eye, X
import clsx from "clsx";
import { motion } from "framer-motion";

// Define PosterSize type here as well, or import from page.tsx if exported
type PosterSize = "small" | "medium" | "large";
// Define GapSize type
type GapSize = "m" | "l" | "xl";
// Added ViewMode type
type ViewMode = "grid" | "list";

// Define props interface
interface DiscoverFilterBarProps {
  posterSize: PosterSize;
  onSizeChange: (size: PosterSize) => void;
  gapSize: GapSize;
  onGapChange: (gap: GapSize) => void;
  categoryTriggerRef: RefObject<HTMLButtonElement>;
  onOpenCategoryPopover: () => void;
  onOpenFilterModal: () => void;
  currentViewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}

const DiscoverFilterBar: React.FC<DiscoverFilterBarProps> = ({
  posterSize,
  onSizeChange,
  gapSize,
  onGapChange,
  categoryTriggerRef,
  onOpenCategoryPopover,
  onOpenFilterModal,
  currentViewMode,
  onViewChange,
}) => {
  const [isSticky, setIsSticky] = useState(false);
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // Измеряем высоту при монтировании
    setToolbarHeight(wrapper.offsetHeight);

    const handleScroll = () => {
      if (wrapper) {
        const offsetTop = wrapper.offsetTop;
        setIsSticky(window.scrollY > offsetTop);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []); // Пустой массив зависимостей, чтобы эффект запускался один раз при монтировании

  return (
    <div ref={wrapperRef} className="relative">
      {" "}
      {/* Обертка для измерения */}
      {/* Плейсхолдер, отображается только когда панель "липкая" */}
      {isSticky && <div style={{ height: `${toolbarHeight}px` }} />}
      <motion.div
        className={clsx(
          "flex items-center justify-between bg-zinc-800/70 backdrop-blur-sm p-2 rounded-full shadow-md border border-zinc-700/50",
          isSticky
            ? "fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg transition-transform duration-300 ease-out"
            : "relative mb-6" // Добавляем mb-6 только когда не липкая
        )}
        initial={{ y: 100, opacity: 0 }}
        animate={{
          y: isSticky ? 0 : 0, // y: 0 когда видна (липкая или нет)
          opacity: 1, // Всегда видима
          transition: { duration: 0.3, ease: "easeOut" },
        }}
      >
        {/* Левая часть: Кнопка Категорий */}
        <div className="relative">
          <button
            ref={categoryTriggerRef}
            onClick={onOpenCategoryPopover}
            className="p-2 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors duration-200"
            aria-label="Открыть категории"
            aria-haspopup="true"
          >
            <LayoutList className="w-5 h-5" />
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
              onClick={() => onViewChange("list")}
              className={clsx(
                "p-1.5 rounded-full transition-colors duration-200",
                currentViewMode === "list"
                  ? "bg-yellow-500 text-black"
                  : "text-zinc-400 hover:text-white"
              )}
              aria-label="Список"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewChange("grid")}
              className={clsx(
                "p-1.5 rounded-full transition-colors duration-200",
                currentViewMode === "grid"
                  ? "bg-yellow-500 text-black"
                  : "text-zinc-400 hover:text-white"
              )}
              aria-label="Сетка"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
          {/* Иконка глаза (пример) - закомментировано, т.к. не используется */}
          {/* <button
            className="p-2 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors duration-200"
            aria-label="Видимость"
          >
            <Eye className="w-5 h-5" />
          </button> */}
          {/* Разделитель */}
          <div className="h-5 w-px bg-zinc-600/50 mx-2"></div>
          {/* Размер элементов - Hide if viewMode is list */}
          <div
            className={clsx(
              "items-center bg-zinc-700/60 p-1 rounded-full text-xs font-medium",
              currentViewMode === "list" ? "hidden" : "flex" // Conditionally hide/show
            )}
          >
            {(["small", "medium", "large"] as const).map((size) => (
              <button
                key={size}
                onClick={() => onSizeChange(size)}
                className={clsx(
                  "px-3 py-1 rounded-full transition-colors duration-200 min-w-[36px] text-center",
                  posterSize === size
                    ? "bg-yellow-500 text-black"
                    : "text-zinc-400 hover:text-white",
                  size === "small" && "hidden md:inline-block"
                )}
                aria-label={`Размер ${
                  size === "small"
                    ? "Мелкий"
                    : size === "medium"
                    ? "Средний"
                    : "Крупный"
                }`}
              >
                {size === "small" ? "M" : size === "medium" ? "L" : "XL"}
              </button>
            ))}
          </div>
          {/* Добавляем кнопки управления промежутком */}
          <div className="hidden md:flex items-center bg-zinc-700/60 p-1 rounded-full text-xs font-medium">
            {(["m", "l", "xl"] as const).map((gap) => (
              <button
                key={gap}
                onClick={() => onGapChange(gap)}
                className={clsx(
                  "px-3 py-1 rounded-full transition-colors duration-200 min-w-[36px] text-center",
                  gapSize === gap
                    ? "bg-yellow-500 text-black"
                    : "text-zinc-400 hover:text-white"
                )}
                aria-label={`Вертикальный промежуток ${gap.toUpperCase()}`}
              >
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
            onClick={onOpenFilterModal}
            className="p-2 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors duration-200"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DiscoverFilterBar;
