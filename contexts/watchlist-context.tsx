"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Определяем типы
type WatchlistItem = {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string;
  vote_average?: number;
  overview: string;
  added_at: number;
  is_watched?: boolean; // Флаг для отметки просмотренных фильмов
};

// Тип для актера в списке подписок
type SubscribedActor = {
  id: number;
  name: string;
  profile_path: string;
  added_at: number;
  is_actor: true; // Флаг для отличия от фильмов
};

interface WatchlistContextProps {
  watchlist: WatchlistItem[];
  subscribedActors: SubscribedActor[]; // Добавлен список подписанных актеров
  isInWatchlist: (id: number) => boolean;
  isActorSubscribed: (id: number) => boolean; // Новая функция для проверки подписки на актера
  addToWatchlist: (item: Omit<WatchlistItem, "added_at">) => void;
  removeFromWatchlist: (id: number) => void;
  markAsWatched: (id: number) => void; // Новая функция для отметки фильма как просмотренного
  markAsUnwatched: (id: number) => void; // Функция для отметки фильма как непросмотренного
  isWatched: (id: number) => boolean; // Проверка, просмотрен ли фильм
  subscribeToActor: (
    actor: Omit<SubscribedActor, "added_at" | "is_actor">
  ) => void; // Подписка на актера
  unsubscribeFromActor: (id: number) => void; // Отписка от актера
  clearWatchlist: () => void;
  isInitialized: boolean;
}

const WatchlistContext = createContext<WatchlistContextProps | undefined>(
  undefined
);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [subscribedActors, setSubscribedActors] = useState<SubscribedActor[]>(
    []
  ); // Новое состояние для актеров
  const [isInitialized, setIsInitialized] = useState(false);

  // Загружаем данные из localStorage при инициализации
  useEffect(() => {
    try {
      const storedWatchlist = localStorage.getItem("watchlist");
      if (storedWatchlist) {
        setWatchlist(JSON.parse(storedWatchlist));
      }

      // Загружаем подписки на актеров
      const storedActors = localStorage.getItem("subscribed_actors");
      if (storedActors) {
        setSubscribedActors(JSON.parse(storedActors));
      }
    } catch (error) {
      console.error("Ошибка при загрузке данных из хранилища:", error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Слушатель событий для синхронизации состояния между вкладками/компонентами
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "watchlist") {
        try {
          if (event.newValue) {
            setWatchlist(JSON.parse(event.newValue));
          } else {
            setWatchlist([]);
          }
        } catch (error) {
          console.error("Ошибка при обновлении избранного:", error);
        }
      }

      // Обработка изменений в подписках на актеров
      if (event.key === "subscribed_actors") {
        try {
          if (event.newValue) {
            setSubscribedActors(JSON.parse(event.newValue));
          } else {
            setSubscribedActors([]);
          }
        } catch (error) {
          console.error("Ошибка при обновлении подписок на актеров:", error);
        }
      }
    };

    const handleWatchlistChange = (e: Event) => {
      try {
        const customEvent = e as CustomEvent;
        if (customEvent.detail && customEvent.detail.watchlist) {
          setWatchlist(customEvent.detail.watchlist);
        } else {
          const storedWatchlist = localStorage.getItem("watchlist");
          if (storedWatchlist) {
            setWatchlist(JSON.parse(storedWatchlist));
          } else {
            setWatchlist([]);
          }
        }

        // Обновляем подписки на актеров, если они есть в событии
        if (customEvent.detail && customEvent.detail.subscribedActors) {
          setSubscribedActors(customEvent.detail.subscribedActors);
        }
      } catch (error) {
        console.error("Ошибка при обновлении данных:", error);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    document.addEventListener("watchlistChange", handleWatchlistChange);
    document.addEventListener("actorSubscriptionChange", handleWatchlistChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("watchlistChange", handleWatchlistChange);
      document.removeEventListener(
        "actorSubscriptionChange",
        handleWatchlistChange
      );
    };
  }, []);

  // Обновляем localStorage при изменении watchlist
  useEffect(() => {
    if (isInitialized) {
      if (watchlist.length === 0) {
        localStorage.removeItem("watchlist");
      } else {
        localStorage.setItem("watchlist", JSON.stringify(watchlist));
      }

      // Создаем событие для обновления других компонентов
      const event = new CustomEvent("watchlistChange", {
        detail: {
          watchlist,
          subscribedActors,
          timestamp: Date.now(),
        },
      });
      document.dispatchEvent(event);
    }
  }, [watchlist, isInitialized]);

  // Обновляем localStorage при изменении subscribedActors
  useEffect(() => {
    if (isInitialized) {
      if (subscribedActors.length === 0) {
        localStorage.removeItem("subscribed_actors");
      } else {
        localStorage.setItem(
          "subscribed_actors",
          JSON.stringify(subscribedActors)
        );
      }

      // Создаем событие для обновления других компонентов
      const event = new CustomEvent("actorSubscriptionChange", {
        detail: {
          subscribedActors,
          timestamp: Date.now(),
        },
      });
      document.dispatchEvent(event);
    }
  }, [subscribedActors, isInitialized]);

  // Проверка наличия элемента в избранном
  const isInWatchlist = (id: number) => {
    return watchlist.some((item) => item.id === id);
  };

  // Проверка подписки на актера
  const isActorSubscribed = (id: number) => {
    return subscribedActors.some((actor) => actor.id === id);
  };

  // Добавление в избранное
  const addToWatchlist = (item: Omit<WatchlistItem, "added_at">) => {
    if (!isInWatchlist(item.id)) {
      setWatchlist((prev) => [...prev, { ...item, added_at: Date.now() }]);
    }
  };

  // Удаление из избранного
  const removeFromWatchlist = (id: number) => {
    setWatchlist((prev) => {
      const newWatchlist = prev.filter((item) => item.id !== id);
      return newWatchlist;
    });
  };

  // Проверка, просмотрен ли фильм
  const isWatched = (id: number) => {
    const movie = watchlist.find((item) => item.id === id);
    return movie ? !!movie.is_watched : false;
  };

  // Отметка фильма как просмотренного
  const markAsWatched = (id: number) => {
    setWatchlist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_watched: true } : item
      )
    );
  };

  // Отметка фильма как непросмотренного
  const markAsUnwatched = (id: number) => {
    setWatchlist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_watched: false } : item
      )
    );
  };

  // Подписка на актера
  const subscribeToActor = (
    actor: Omit<SubscribedActor, "added_at" | "is_actor">
  ) => {
    if (!isActorSubscribed(actor.id)) {
      setSubscribedActors((prev) => [
        ...prev,
        { ...actor, added_at: Date.now(), is_actor: true },
      ]);
    }
  };

  // Отписка от актера
  const unsubscribeFromActor = (id: number) => {
    setSubscribedActors((prev) => {
      const newSubscriptions = prev.filter((actor) => actor.id !== id);
      return newSubscriptions;
    });
  };

  // Полная очистка избранного
  const clearWatchlist = () => {
    setWatchlist([]);
    setSubscribedActors([]);
    localStorage.removeItem("watchlist");
    localStorage.removeItem("subscribed_actors");
    const event = new CustomEvent("watchlistChange", {
      detail: {
        watchlist: [],
        subscribedActors: [],
        timestamp: Date.now(),
      },
    });
    document.dispatchEvent(event);
  };

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        subscribedActors,
        isInWatchlist,
        isActorSubscribed,
        addToWatchlist,
        removeFromWatchlist,
        markAsWatched,
        markAsUnwatched,
        isWatched,
        subscribeToActor,
        unsubscribeFromActor,
        clearWatchlist,
        isInitialized,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error("useWatchlist must be used within a WatchlistProvider");
  }
  return context;
}
