"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { BookmarkPlus, Check, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWatchlist } from "@/contexts/watchlist-context";
import { playSound } from "@/lib/sound-utils";

// Создаем пользовательское событие для обновления списка избранного
const createWatchlistChangeEvent = () => {
  const event = new CustomEvent("watchlistChange", {
    detail: { timestamp: Date.now() },
  });
  document.dispatchEvent(event);
};

// Типы уведомлений
type NotificationType = "success" | "error" | "info";

interface WatchlistButtonProps {
  movie: {
    id: number;
    title: string;
    poster_path: string;
    backdrop_path: string;
    release_date?: string;
    vote_average?: number;
    overview: string;
  };
  onWatchlistAction?: (action: "add" | "remove", title: string) => void;
  className?: string;
  wrapperClass?: string;
}

export default function WatchlistButton({
  movie,
  onWatchlistAction,
  className = "",
  wrapperClass = "",
}: WatchlistButtonProps) {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();

  // Локальное состояние для отслеживания статуса
  const [isInWatchlistLocal, setIsInWatchlistLocal] = useState(false);

  // Синхронизация с контекстом
  useEffect(() => {
    if (movie?.id) {
      const status = isMovieInWatchlist(movie.id);
      setIsInWatchlistLocal(status);
    }
  }, [movie?.id]);

  // Локальная функция проверки статуса
  function isMovieInWatchlist(movieId: number): boolean {
    try {
      const watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
      return watchlist.some((item: any) => item.id === movie.id);
    } catch (e) {
      console.error("Ошибка при проверке статуса избранного:", e);
      return false;
    }
  }

  // Обработчик добавления/удаления из watchlist
  const handleWatchlistClick = () => {
    // Воспроизводим звук при нажатии
    playSound("choose.mp3");

    // Текущий статус
    const currentStatus = isInWatchlistLocal;

    // Обновляем UI немедленно для улучшения отзывчивости
    setIsInWatchlistLocal(!currentStatus);

    try {
      if (!currentStatus) {
        // Добавляем в watchlist если не был в списке
        addToWatchlist(movie);

        // Оповещаем родителя о действии с правильным действием "add"
        if (onWatchlistAction) {
          onWatchlistAction("add", movie.title);
        }
      } else {
        // Удаляем из watchlist если был в списке
        removeFromWatchlist(movie.id);

        // Оповещаем родителя с правильным действием "remove"
        if (onWatchlistAction) {
          onWatchlistAction("remove", movie.title);
        }
      }

      // Проверяем, есть ли watchlist в localStorage
      const watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");

      // Проверяем, есть ли фильм в списке
      const index = watchlist.findIndex((item: any) => item.id === movie.id);
      const isCurrentlyInWatchlist = index !== -1;

      // Выполняем действие в зависимости от состояния
      if (!isCurrentlyInWatchlist) {
        // Добавление в watchlist
        const updatedMovie = {
          ...movie,
          added_at: Date.now(),
        };
        watchlist.push(updatedMovie);
        localStorage.setItem("watchlist", JSON.stringify(watchlist));
      } else {
        // Удаление из watchlist
        watchlist.splice(index, 1);
        localStorage.setItem("watchlist", JSON.stringify(watchlist));
      }

      // Вызываем событие изменения watchlist
      document.dispatchEvent(new Event("watchlistChange"));
    } catch (e) {
      console.error("Ошибка при работе с watchlist:", e);
      // Откатываем UI в случае ошибки
      setIsInWatchlistLocal(currentStatus);
    }
  };

  // Используем это только для уведомлений
  const [notification, setNotification] = useState({
    message: "",
    type: "success" as "success" | "error" | "info",
    visible: false,
  });

  const notificationRef = useRef<HTMLDivElement>(null);

  // Добавим принудительное обновление компонента
  const [_, forceUpdate] = useState({});

  // Функция для показа локального уведомления
  function showLocalNotification(
    message: string,
    type: "success" | "error" | "info" = "success"
  ) {
    setNotification({
      message,
      type,
      visible: true,
    });

    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 3000);
  }

  // Определяем стили уведомления
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

  useEffect(() => {
    console.log("WatchlistButton rendered for movie", movie.id);
    console.log(
      "Current DOM path:",
      Array.from(
        document.querySelectorAll(`[data-movie-id="${movie.id}"]`)
      ).map((el) => {
        let path = "";
        let current = el;
        while (current && current !== document.body) {
          path =
            current.tagName +
            (current.id ? "#" + current.id : "") +
            (current.className
              ? "." + current.className.replace(/\s+/g, ".")
              : "") +
            " > " +
            path;
          current = current.parentElement;
        }
        return path;
      })
    );
  }, [movie.id]);

  return (
    <div
      className={`relative watchlist-button-component ${wrapperClass}`}
      data-debug-id="watchlist-button-instance"
      data-movie-id={movie.id}
    >
      <div className={`flex justify-center ${wrapperClass}`}>
        <button
          type="button"
          onClick={handleWatchlistClick}
          className={`flex items-center gap-2 pl-4 pr-7 py-[14px] rounded-full text-sm transition-colors ${
            isInWatchlistLocal
              ? "bg-yellow-500 text-black hover:bg-yellow-600"
              : "bg-white text-black hover:bg-white/90"
          } ${className}`}
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: isInWatchlistLocal ? "black" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
          >
            {isInWatchlistLocal ? (
              <Check className="text-yellow-500" size={16} />
            ) : (
              <BookmarkPlus size={20} />
            )}
          </div>
          <span className="text-sm">
            {isInWatchlistLocal ? "В медиатеке" : "В избранное"}
          </span>
        </button>
      </div>

      {/* Локальное уведомление */}
      <div ref={notificationRef} className="mt-2">
        <AnimatePresence>
          {notification.visible && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div
                className={`${notificationStyles.bgColor} ${notificationStyles.textColor} px-4 py-3 rounded-lg shadow-lg flex items-center gap-3`}
              >
                <div className="flex-shrink-0">{notificationStyles.icon}</div>
                <div className="flex-grow">{notification.message}</div>
                <button
                  onClick={() =>
                    setNotification((prev) => ({ ...prev, visible: false }))
                  }
                  className="flex-shrink-0 hover:opacity-80 transition-opacity"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Создаем отдельный компонент кнопки для подписки на актеров
export function SubscribeActorButton({
  actor,
  className = "",
  wrapperClass = "",
}: {
  actor: {
    id: number;
    name: string;
    profile_path: string;
  };
  className?: string;
  wrapperClass?: string;
}) {
  const { subscribeToActor, unsubscribeFromActor, isActorSubscribed } =
    useWatchlist();

  // Локальное состояние для отслеживания статуса
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Синхронизация с контекстом
  useEffect(() => {
    if (actor?.id) {
      const status = isActorSubscribedLocal(actor.id);
      setIsSubscribed(status);
    }
  }, [actor?.id]);

  // Локальная функция проверки статуса
  function isActorSubscribedLocal(actorId: number): boolean {
    try {
      const subscribedActors = JSON.parse(
        localStorage.getItem("subscribed_actors") || "[]"
      );
      return subscribedActors.some((item: any) => item.id === actor.id);
    } catch (e) {
      console.error("Ошибка при проверке статуса подписки:", e);
      return false;
    }
  }

  // Обработчик подписки/отписки
  const handleSubscribeClick = () => {
    // Текущий статус
    const currentStatus = isSubscribed;

    // Немедленно обновляем UI для мгновенной реакции
    setIsSubscribed(!currentStatus);

    // Воспроизводим звук при нажатии
    setTimeout(() => playSound("choose.mp3"), 0);

    try {
      if (!currentStatus) {
        // Подписываемся на актера
        subscribeToActor(actor);
      } else {
        // Отписываемся от актера
        unsubscribeFromActor(actor.id);
      }

      // Оборачиваем работу с localStorage в setTimeout для улучшения отзывчивости UI
      setTimeout(() => {
        try {
          // Проверяем, есть ли подписки в localStorage
          const subscribedActors = JSON.parse(
            localStorage.getItem("subscribed_actors") || "[]"
          );

          // Проверяем, есть ли актер в списке
          const index = subscribedActors.findIndex(
            (item: any) => item.id === actor.id
          );
          const isCurrentlySubscribed = index !== -1;

          // Выполняем действие в зависимости от состояния
          if (!isCurrentlySubscribed && !currentStatus) {
            // Подписка на актера
            const updatedActor = {
              ...actor,
              added_at: Date.now(),
              is_actor: true,
            };
            subscribedActors.push(updatedActor);
            localStorage.setItem(
              "subscribed_actors",
              JSON.stringify(subscribedActors)
            );
          } else if (isCurrentlySubscribed && currentStatus) {
            // Отписка от актера
            subscribedActors.splice(index, 1);
            localStorage.setItem(
              "subscribed_actors",
              JSON.stringify(subscribedActors)
            );
          }

          // Вызываем событие изменения подписок
          document.dispatchEvent(new Event("actorSubscriptionChange"));
        } catch (storageError) {
          console.error("Ошибка при работе с localStorage:", storageError);
        }
      }, 0);
    } catch (e) {
      console.error("Ошибка при работе с подписками:", e);
      // Откатываем UI в случае ошибки
      setIsSubscribed(currentStatus);
    }
  };

  return (
    <div
      className={`relative actor-subscribe-button ${wrapperClass}`}
      data-actor-id={actor.id}
    >
      <div className={`flex justify-center ${wrapperClass}`}>
        <button
          type="button"
          onClick={handleSubscribeClick}
          className={`flex items-center justify-center gap-2 pl-4 pr-7 py-[14px] rounded-full text-sm font-medium transition-colors h-12 min-w-[160px] ${
            isSubscribed
              ? "bg-yellow-500 text-black hover:bg-yellow-600"
              : "bg-white text-black hover:bg-white/90"
          } ${className}`}
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
          >
            {isSubscribed ? (
              <Check className="text-black" size={20} />
            ) : (
              <BookmarkPlus size={20} />
            )}
          </div>
          <span className="text-sm whitespace-nowrap">
            {isSubscribed ? "Вы подписаны" : "Подписаться"}
          </span>
        </button>
      </div>
    </div>
  );
}
