"use client";

import React, { RefObject } from "react";
import { List, Grid, Filter, LayoutList } from "lucide-react"; // Removed Eye, X
import clsx from "clsx";

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

// Remove forwardRef wrapper
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
  return (
    // Remove ref from the root div
    <div className="relative flex items-center justify-between bg-zinc-800/70 backdrop-blur-sm p-2 rounded-full shadow-md border border-zinc-700/50 mb-6">
      {/* Левая часть: Кнопка Категорий */}
      <div className="relative">
        <button
          ref={categoryTriggerRef} // Use category ref
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
        {/* Размер элементов */}
        <div className="flex items-center bg-zinc-700/60 p-1 rounded-full text-xs font-medium">
          {(["small", "medium", "large"] as const).map((size) => (
            <button
              key={size}
              onClick={() => onSizeChange(size)}
              className={clsx(
                "px-3 py-1 rounded-full transition-colors duration-200 min-w-[36px] text-center",
                posterSize === size
                  ? "bg-yellow-500 text-black"
                  : "text-zinc-400 hover:text-white"
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
    </div>
  );
};

export default DiscoverFilterBar;
