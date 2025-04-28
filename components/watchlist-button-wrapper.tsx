"use client";

import { useState, useEffect, useRef } from "react";
import WatchlistButton from "@/components/watchlist-button";
import { BookmarkPlus } from "lucide-react";

interface WatchlistButtonWrapperProps {
  movie: any;
  onWatchlistAction: (action: "add" | "remove", title: string) => void;
  className?: string;
}

export default function WatchlistButtonWrapper({
  movie,
  onWatchlistAction,
  className,
}: WatchlistButtonWrapperProps) {
  // Использовать ref для отслеживания монтирования компонента
  const componentRef = useRef(null);
  const [renderKey, setRenderKey] = useState(Date.now());

  // Разделяем классы отступов от остальных классов
  const nonPaddingClasses = className?.replace(/p[xy]-\d+|p-\d+/g, "") || "";
  const paddingClasses = className?.match(/p[xy]-\d+|p-\d+/g)?.join(" ") || "";

  useEffect(() => {
    // Печатаем информацию для отладки
    console.log("WatchlistButtonWrapper mounted", componentRef.current);

    // Ищем все экземпляры кнопок для этого фильма
    const allButtons = document.querySelectorAll(
      `[data-movie-id="${movie.id}"]`
    );
    console.log(
      `Found ${allButtons.length} watchlist buttons for movie ${movie.id}`
    );

    // Если это первая кнопка, добавляем специальный атрибут, который поможет найти её
    if (allButtons.length === 1 && componentRef.current) {
      componentRef.current.setAttribute("data-primary-button", "true");
    }

    // Если их больше одной, помечаем все для отладки
    if (allButtons.length > 1) {
      allButtons.forEach((btn, i) => {
        btn.setAttribute("data-button-index", i.toString());
        console.log(`Button ${i} rect:`, btn.getBoundingClientRect());
      });
    }
  }, [movie.id, renderKey]);

  return (
    <div
      ref={componentRef}
      className={`watchlist-button-wrapper p-0 m-0 ${nonPaddingClasses}`}
    >
      <WatchlistButton
        movie={movie}
        onWatchlistAction={(action, title) => onWatchlistAction(action, title)}
        wrapperClass="p-0 m-0"
        className={paddingClasses}
      />
    </div>
  );
}
