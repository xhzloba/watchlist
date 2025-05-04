import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Film, CalendarClock, TrendingUp, Sparkles } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/constants";
import clsx from "clsx";

interface Category {
  label: string;
  icon: React.ElementType;
  params: Record<string, string | null>; // Parameters to set/delete
}

interface CategoryPopoverContentProps {
  onClose: () => void; // Function to close the popover
}

const CategoryPopoverContent: React.FC<CategoryPopoverContentProps> = ({
  onClose,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categories: Category[] = [
    {
      label: "Все фильмы",
      icon: Film,
      params: { year: null, trending: null, sort_by: "popularity.desc" }, // Keep sort_by
    },
    {
      label: "Новинки 2025",
      icon: CalendarClock,
      params: { year: "2025", trending: null, sort_by: "popularity.desc" },
    },
    {
      label: "Сейчас в тренде",
      icon: TrendingUp,
      params: { year: null, trending: "day", sort_by: null }, // Remove sort_by for trending
    },
    {
      label: "В тренде за неделю",
      icon: Sparkles,
      params: { year: null, trending: "week", sort_by: null }, // Remove sort_by for trending
    },
  ];

  const handleCategorySelect = (category: Category) => {
    // Create new params, start fresh to easily clear old filters
    const newParams = new URLSearchParams();

    // Apply the parameters specific to this category
    Object.entries(category.params).forEach(([key, value]) => {
      if (value !== null) {
        // Only set non-null values
        newParams.set(key, value);
      }
      // Null values in category.params implicitly mean the key should not be present,
      // and since we start with empty newParams, we don't need to explicitly delete them here.
    });

    // Copy essential non-filter params from current URL if they exist (like size, gap)
    const essentialKeys = ["size", "gap"]; // Add other persistent params if needed
    searchParams.forEach((value, key) => {
      if (essentialKeys.includes(key)) {
        newParams.set(key, value);
      }
    });

    // We don't need to set page (it defaults to 1/is absent)
    // We don't need to set 't' here, router.push handles cache busting if needed, or add it?
    // Let's add 't' for explicit cache busting consistency
    newParams.set("t", Date.now().toString());

    // Clear session cache regardless
    Object.values(STORAGE_KEYS).forEach((key) => {
      if (key !== STORAGE_KEYS.FROM_DISCOVER) sessionStorage.removeItem(key);
    });

    router.push(`/discover?${newParams.toString()}`, { scroll: false });
    onClose(); // Close the popover after navigation
  };

  // Function to check if a category is currently active based on URL params
  const isCategoryActive = (category: Category): boolean => {
    const currentYear = searchParams.get("year");
    const currentTrending = searchParams.get("trending");
    const currentSortBy = searchParams.get("sort_by");

    const isActive = Object.entries(category.params).every(([key, value]) => {
      const currentParamValue = searchParams.get(key);
      if (value === null) {
        // For params to be deleted, check if they are actually absent in the URL
        // Exception: 'sort_by' defaults to 'popularity.desc' when others are null
        if (
          key === "sort_by" &&
          value === "popularity.desc" &&
          !currentYear &&
          !currentTrending
        ) {
          return currentParamValue === "popularity.desc" || !currentParamValue;
        }
        return !currentParamValue;
      } else {
        // For params to be set, check if they match the URL value
        return currentParamValue === value;
      }
    });

    // Special case for "Все фильмы": active if no year and no trending are set
    if (category.label === "Все фильмы") {
      return (
        !currentYear &&
        !currentTrending &&
        (currentSortBy === "popularity.desc" || !currentSortBy)
      );
    }

    // Special case for trending: sort_by should NOT be set
    if (
      (category.params.trending === "day" ||
        category.params.trending === "week") &&
      category.params.sort_by === null
    ) {
      return isActive && !currentSortBy;
    }

    return isActive;
  };

  return (
    <div className="w-60 bg-zinc-900 border border-zinc-700/50 rounded-lg shadow-2xl overflow-hidden">
      <ul className="p-2 flex flex-col gap-1">
        {categories.map((category) => {
          const Icon = category.icon;
          const active = isCategoryActive(category);
          return (
            <li key={category.label}>
              <button
                onClick={() => handleCategorySelect(category)}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150",
                  active
                    ? "bg-yellow-500 text-black font-medium"
                    : "text-zinc-300 hover:bg-zinc-700 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{category.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default CategoryPopoverContent;
