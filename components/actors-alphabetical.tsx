"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { useDebounce } from "use-debounce";

// Актер в формате из API
interface ActorItem {
  id: number;
  name: string;
  imageUrl: string | null;
  biography?: string;
  known_for?: any[];
}

// Алфавитные группы актеров
interface AlphabeticalGroups {
  [key: string]: ActorItem[];
}

export default function ActorsAlphabetical() {
  const [actors, setActors] = useState<ActorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const loadingRef = useRef(false);
  const currentPageRef = useRef(1);

  // Функция поиска актеров через API
  const searchActors = async (
    query: string,
    page: number = 1,
    reset: boolean = false
  ) => {
    if (!query.trim() || loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);

    try {
      const response = await fetch(
        `/api/actors?query=${encodeURIComponent(query)}&page=${page}`
      );
      if (!response.ok) {
        throw new Error(`Ошибка при поиске актеров: ${response.status}`);
      }

      const data = await response.json();

      // Если найден только один актер, получим его биографию
      if (data.actors?.length === 1 && reset) {
        try {
          const actorResponse = await fetch(`/api/actors/${data.actors[0].id}`);
          if (actorResponse.ok) {
            const actorData = await actorResponse.json();
            // Добавляем биографию к актеру, если она есть
            if (actorData.biography) {
              data.actors[0].biography = actorData.biography;
            }
          }
        } catch (err) {
          console.error("Ошибка при получении информации об актере:", err);
        }
      }

      if (reset) {
        setActors(data.actors || []);
      } else {
        setActors((prev) => [...prev, ...(data.actors || [])]);
      }

      setTotalPages(data.total_pages || 0);
      setTotalResults(data.total_results || 0);
      currentPageRef.current = page + 1;
    } catch (err) {
      console.error("Ошибка при поиске актеров:", err);
      setError("Не удалось выполнить поиск актеров");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  // Загрузка первой порции популярных актеров при первом рендере
  useEffect(() => {
    const loadInitialActors = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/actors?page=1");
        if (!response.ok) {
          throw new Error(`Ошибка при загрузке актеров: ${response.status}`);
        }

        const data = await response.json();
        setActors(data.actors || []);
        setTotalPages(data.total_pages || 0);
        setTotalResults(data.total_results || 0);
        currentPageRef.current = 2;
      } catch (err) {
        console.error("Ошибка при загрузке актеров:", err);
        setError("Не удалось загрузить список актеров");
      } finally {
        setLoading(false);
      }
    };

    if (!searchQuery.trim()) {
      loadInitialActors();
    }
  }, []);

  // Эффект для выполнения поиска при изменении запроса
  useEffect(() => {
    if (debouncedQuery.trim()) {
      // Сбрасываем страницу и результаты при новом поиске
      currentPageRef.current = 1;
      searchActors(debouncedQuery, 1, true);
    } else if (actors.length === 0) {
      // Если поисковая строка пуста и нет актеров, загружаем популярных
      const loadPopularActors = async () => {
        setLoading(true);
        try {
          const response = await fetch("/api/actors?page=1");
          if (!response.ok) {
            throw new Error(`Ошибка при загрузке актеров: ${response.status}`);
          }

          const data = await response.json();
          setActors(data.actors || []);
          setTotalPages(data.total_pages || 0);
          setTotalResults(data.total_results || 0);
          currentPageRef.current = 2;
        } catch (err) {
          console.error("Ошибка при загрузке актеров:", err);
        } finally {
          setLoading(false);
        }
      };

      loadPopularActors();
    }
  }, [debouncedQuery]);

  // Загрузка дополнительных результатов
  const loadMoreActors = () => {
    if (loadingRef.current || currentPageRef.current > totalPages) return;

    if (debouncedQuery.trim()) {
      searchActors(debouncedQuery, currentPageRef.current);
    } else {
      const loadMorePopular = async () => {
        if (loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);

        try {
          const response = await fetch(
            `/api/actors?page=${currentPageRef.current}`
          );
          if (!response.ok) {
            throw new Error(`Ошибка при загрузке актеров: ${response.status}`);
          }

          const data = await response.json();
          setActors((prev) => [...prev, ...(data.actors || [])]);
          currentPageRef.current += 1;
        } catch (err) {
          console.error("Ошибка при загрузке дополнительных актеров:", err);
        } finally {
          loadingRef.current = false;
          setLoading(false);
        }
      };

      loadMorePopular();
    }
  };

  // Обработчик прокрутки для подгрузки актеров
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      loadMoreActors();
    }
  };

  // Определяем, что показывать в контенте
  const showNoResults = searchQuery.trim() && actors.length === 0 && !loading;
  const showStartTyping =
    !searchQuery.trim() && actors.length === 0 && !loading;
  const showActors = actors.length > 0;
  const canLoadMore = currentPageRef.current <= totalPages;

  return (
    <div className="max-h-[70vh] overflow-hidden flex flex-col">
      {/* Поиск */}
      <div
        className="px-4 py-3 sticky top-0 z-10 border-b border-gray-800"
        style={{ backgroundColor: "rgb(38 38 38)" }}
      >
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-gray-700 rounded-none focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-sm text-white"
            style={{ backgroundColor: "rgb(38 38 38)" }}
            placeholder="Введите имя актера..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
        {loading && actors.length === 0 && (
          <div className="mt-2 flex justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
          </div>
        )}

        {totalResults > 0 && searchQuery.trim() && (
          <div className="mt-2 text-xs text-gray-400 text-center">
            Найдено актеров: {totalResults}
          </div>
        )}
      </div>

      {/* Результаты поиска */}
      <div className="flex-1 overflow-y-auto px-2 py-2" onScroll={handleScroll}>
        {error ? (
          <div className="text-center py-4 text-red-500">{error}</div>
        ) : showStartTyping ? (
          <div className="text-center py-8 text-gray-400">
            Начните вводить имя актера...
          </div>
        ) : showNoResults ? (
          <div className="text-center py-8 text-gray-400">
            Актеры не найдены
          </div>
        ) : showActors ? (
          actors.length === 1 && actors[0].biography ? (
            // Отображаем одного актера с биографией
            <div className="p-4">
              <div className="flex items-start gap-4 mb-4">
                <div className="relative w-24 h-32 rounded overflow-hidden border border-gray-700 flex-shrink-0">
                  {actors[0].imageUrl ? (
                    <Image
                      src={actors[0].imageUrl}
                      alt={actors[0].name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {actors[0].name}
                  </h3>
                  <Link
                    href={`/actors/${actors[0].id}`}
                    className="text-xs bg-yellow-500 text-black px-3 py-1 inline-block mb-2 hover:bg-yellow-400 transition-colors rounded-none"
                  >
                    Открыть профиль
                  </Link>
                  <div className="text-sm text-gray-300 max-h-[300px] overflow-y-auto pr-2">
                    {actors[0].biography}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {actors.map((actor) => (
                <Link
                  key={actor.id}
                  href={`/actors/${actor.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:text-black transition-colors group"
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-700">
                    {actor.imageUrl ? (
                      <Image
                        src={actor.imageUrl}
                        alt={actor.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-300 group-hover:text-black">
                    {actor.name}
                  </span>
                </Link>
              ))}
            </div>
          )
        ) : null}

        {/* Индикатор загрузки в конце списка */}
        {loading && actors.length > 0 && (
          <div className="py-4 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />
          </div>
        )}

        {/* Кнопка "Загрузить еще" если есть что загружать */}
        {showActors && canLoadMore && !loading && (
          <div className="px-4 py-3 flex justify-start">
            <button
              onClick={loadMoreActors}
              className="text-sm bg-yellow-500 hover:bg-yellow-400 text-black py-1.5 px-4 rounded-none flex items-center gap-2 transition-colors"
            >
              Загрузить больше актеров
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
