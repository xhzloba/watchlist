"use client";

import { useState, useEffect, useRef } from "react";
import { useUsername } from "@/contexts/username-context";
import {
  X,
  User,
  Settings,
  Palette,
  Volume2,
  FileText,
  LogOut,
  Repeat,
  Edit,
  Download,
  Upload,
} from "lucide-react";
import GradientBackground from "@/components/gradient-background";
import { playSound } from "@/lib/sound-utils";
import { STORAGE_KEYS } from "@/lib/constants"; // Импортируем константы ключей
import { Suspense } from "react"; // Импортируем Suspense
import { useReleaseQualityVisibility } from "@/components/movie-card-wrapper"; // Исправляем путь
import { useUISettings } from "@/context/UISettingsContext"; // Импортируем хук

// Говорим Next.js рендерить эту страницу всегда динамически
export const dynamic = "force-dynamic";

// Ключи localStorage для настроек
const SETTINGS_KEYS = {
  SHOW_MOVIE_RATING: "settings_show_movie_rating",
  ENABLE_SOUND_EFFECTS: "settings_enable_sound_effects",
  ROUNDED_CORNERS: "settings_rounded_corners",
  SHOW_TITLES: "settings_show_titles",
  YELLOW_HOVER: "settings_yellow_hover",
  DYNAMIC_BACKDROP: "settings_dynamic_backdrop",
  DISABLE_COLOR_OVERLAY: "settings_disable_color_overlay",
};

// Определяем правильные ключи watchlist здесь для ясности
const WATCHLIST_STORAGE_KEY = "watchlist";
const SUBSCRIBED_ACTORS_STORAGE_KEY = "subscribed_actors";

// Безопасные функции для localStorage (дублируем или импортируем из utils)
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

// Компонент переключателя
interface SettingToggleProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const SettingToggle: React.FC<SettingToggleProps> = ({
  id,
  label,
  description,
  checked,
  onChange,
}) => {
  // Добавляем промежуточный обработчик для логгирования
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newCheckedState = event.target.checked;
    onChange(newCheckedState); // Вызываем переданную функцию обновления состояния
  };

  return (
    <div className="mb-4 p-5 bg-gradient-to-br from-white/5 to-white/10 rounded-lg border border-white/10 shadow-sm transition-all duration-200 hover:bg-white/15 hover:border-white/20">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="flex items-center justify-between w-full cursor-pointer"
        >
          <span className="text-white font-medium mr-4">{label}</span>
          <div className="relative flex-shrink-0">
            <input
              type="checkbox"
              id={id}
              checked={checked}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div
              className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                checked ? "bg-yellow-500" : "bg-gray-600"
              } peer-focus:ring-2 peer-focus:ring-yellow-400/50`}
            >
              <div
                className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform duration-200 ${
                  checked ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </div>
          </div>
        </label>
      </div>
      <p className="text-gray-400 text-sm mt-1">{description}</p>
    </div>
  );
};

export default function ProfilePage() {
  const { username, setUsername, isLoaded } = useUsername();
  const { showCardGlow, toggleCardGlow } = useUISettings();
  const [mounted, setMounted] = useState(false);
  const [nameInitial, setNameInitial] = useState<string | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempUsername, setTempUsername] = useState("");

  // Состояния настроек, перенесенные из Header
  const [showMovieRating, setShowMovieRating] = useState(true); // Значение по умолчанию
  const [enableSoundEffects, setEnableSoundEffects] = useState(false);
  const [roundedCorners, setRoundedCorners] = useState(false);
  const [showTitles, setShowTitles] = useState(true);
  const [yellowHover, setYellowHover] = useState(false);
  const [dynamicBackdrop, setDynamicBackdrop] = useState(false);
  const [disableColorOverlay, setDisableColorOverlay] = useState(false);

  // Вкладки
  // Инициализируем по умолчанию, загрузка из localStorage будет в useEffect
  const [activeTab, setActiveTab] = useState("account");
  const [importExportMessage, setImportExportMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null); // Ref для input[type=file]

  // Инициализация состояний из localStorage при монтировании
  useEffect(() => {
    setMounted(true);
    // Загружаем состояния настроек
    setShowMovieRating(safeGetItem(SETTINGS_KEYS.SHOW_MOVIE_RATING) === "true");
    setEnableSoundEffects(
      safeGetItem(SETTINGS_KEYS.ENABLE_SOUND_EFFECTS) === "true"
    );
    setRoundedCorners(safeGetItem(SETTINGS_KEYS.ROUNDED_CORNERS) === "true");
    setShowTitles(safeGetItem(SETTINGS_KEYS.SHOW_TITLES) === "true");
    setYellowHover(safeGetItem(SETTINGS_KEYS.YELLOW_HOVER) === "true");
    setDynamicBackdrop(safeGetItem(SETTINGS_KEYS.DYNAMIC_BACKDROP) === "true");
    setDisableColorOverlay(
      safeGetItem(SETTINGS_KEYS.DISABLE_COLOR_OVERLAY) === "true"
    );
    // Загружаем активную вкладку
    const savedTab = safeGetItem("profile_active_tab");
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, []);

  // Сохранение активной вкладки в localStorage
  useEffect(() => {
    if (mounted) {
      safeSetItem("profile_active_tab", activeTab);
    }
  }, [activeTab, mounted]);

  // Обновление инициала при изменении username
  useEffect(() => {
    if (isLoaded && username) {
      setNameInitial(username.charAt(0).toUpperCase());
      setTempUsername(username); // Инициализируем tempUsername текущим именем
    }
  }, [username, isLoaded]);

  // Сохранение настроек в localStorage при их изменении
  useEffect(() => {
    if (mounted) {
      safeSetItem(SETTINGS_KEYS.SHOW_MOVIE_RATING, showMovieRating.toString());
      safeSetItem(
        SETTINGS_KEYS.ENABLE_SOUND_EFFECTS,
        enableSoundEffects.toString()
      );
      safeSetItem(SETTINGS_KEYS.ROUNDED_CORNERS, roundedCorners.toString());
      safeSetItem(SETTINGS_KEYS.SHOW_TITLES, showTitles.toString());
      safeSetItem(SETTINGS_KEYS.YELLOW_HOVER, yellowHover.toString());
      safeSetItem(SETTINGS_KEYS.DYNAMIC_BACKDROP, dynamicBackdrop.toString());
      safeSetItem(
        SETTINGS_KEYS.DISABLE_COLOR_OVERLAY,
        disableColorOverlay.toString()
      );

      // Оповещаем другие компоненты об изменении настроек (если нужно)
      // Можно использовать CustomEvent, как было в Header, или контекст настроек
      const event = new CustomEvent("settingsChange", {
        detail: {
          showMovieRating,
          enableSoundEffects,
          roundedCorners,
          showTitles,
          yellowHover,
          dynamicBackdrop,
          disableColorOverlay,
        },
      });
      document.dispatchEvent(event);
    }
  }, [
    showMovieRating,
    enableSoundEffects,
    roundedCorners,
    showTitles,
    yellowHover,
    dynamicBackdrop,
    disableColorOverlay,
    mounted,
  ]);

  // Функция сохранения имени (перенесена сюда)
  function saveUsername(name: string) {
    if (name.trim().length > 0) {
      setUsername(name);
      setShowNameModal(false);
      playSound("confirm.mp3");
    }
  }

  // Функция сброса настроек (пример)
  const resetSettings = () => {
    // Сбрасываем состояния к значениям по умолчанию
    setShowMovieRating(true);
    setEnableSoundEffects(false);
    setRoundedCorners(false);
    setShowTitles(true);
    setYellowHover(false);
    setDynamicBackdrop(false);
    setDisableColorOverlay(false);
    // Можно добавить звук
    playSound("reset.mp3");
    // localStorage обновится через useEffect
  };

  // Функция Экспорта
  const exportDataToJson = () => {
    try {
      const dataToExport: {
        settings: Record<string, any>;
        watchlistData: Record<string, any>;
      } = {
        settings: {},
        watchlistData: {}, // Переименовал для ясности, что это данные, а не ключ
      };

      // Собираем настройки
      Object.keys(SETTINGS_KEYS).forEach((key) => {
        const storageKey = SETTINGS_KEYS[key as keyof typeof SETTINGS_KEYS];
        const value = safeGetItem(storageKey);
        if (value !== null) {
          // Пытаемся распарсить JSON, если значение похоже на JSON (для будущих сложных настроек)
          // Простые булевы значения оставляем как строки "true"/"false"
          try {
            if (
              (value.startsWith("{") && value.endsWith("}")) ||
              (value.startsWith("[") && value.endsWith("]"))
            ) {
              dataToExport.settings[storageKey] = JSON.parse(value);
            } else {
              dataToExport.settings[storageKey] = value; // Оставляем как строку (true/false)
            }
          } catch (e) {
            dataToExport.settings[storageKey] = value; // Если парсинг не удался, сохраняем как есть
          }
        }
      });

      // Собираем данные watchlist
      const watchlistValue = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (watchlistValue) {
        try {
          dataToExport.watchlistData[WATCHLIST_STORAGE_KEY] =
            JSON.parse(watchlistValue);
        } catch (e) {
          console.error(
            `Ошибка парсинга JSON для ключа ${WATCHLIST_STORAGE_KEY} при экспорте:`,
            e
          );
        }
      }

      // Собираем данные subscribed_actors
      const actorsValue = localStorage.getItem(SUBSCRIBED_ACTORS_STORAGE_KEY);
      if (actorsValue) {
        try {
          dataToExport.watchlistData[SUBSCRIBED_ACTORS_STORAGE_KEY] =
            JSON.parse(actorsValue);
        } catch (e) {
          console.error(
            `Ошибка парсинга JSON для ключа ${SUBSCRIBED_ACTORS_STORAGE_KEY} при экспорте:`,
            e
          );
        }
      }

      // Добавляем имя пользователя
      const currentUsername = safeGetItem(STORAGE_KEYS.USERNAME);
      if (currentUsername) {
        dataToExport.settings[STORAGE_KEYS.USERNAME] = currentUsername;
      }

      const jsonString = JSON.stringify(dataToExport, null, 2); // null, 2 для красивого форматирования
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, "-");
      link.download = `watchlist_settings_backup_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setImportExportMessage({
        type: "success",
        text: "Данные успешно экспортированы!",
      });
      playSound("export_success.mp3");
    } catch (error) {
      console.error("Ошибка при экспорте данных:", error);
      setImportExportMessage({
        type: "error",
        text: "Произошла ошибка при экспорте.",
      });
      playSound("error.mp3");
    }
    // Скрываем сообщение через некоторое время
    setTimeout(() => setImportExportMessage(null), 5000);
  };

  // Функция Импорта
  const importDataFromJson = (fileContent: string) => {
    try {
      const parsedData = JSON.parse(fileContent);

      // Обновляем валидацию структуры
      if (
        !parsedData ||
        typeof parsedData !== "object" ||
        !parsedData.settings ||
        !parsedData.watchlistData
      ) {
        throw new Error(
          "Некорректный формат файла. Отсутствуют разделы settings или watchlistData."
        );
      }

      // Импортируем настройки
      if (
        typeof parsedData.settings === "object" &&
        parsedData.settings !== null
      ) {
        Object.keys(parsedData.settings).forEach((key) => {
          // Проверяем, что ключ относится к известным настройкам или имени пользователя
          const isSettingKey = Object.values(SETTINGS_KEYS).includes(key);
          const isUsernameKey = key === STORAGE_KEYS.USERNAME;

          if (isSettingKey || isUsernameKey) {
            const value = parsedData.settings[key];
            // Сохраняем как строку, т.к. localStorage хранит строки
            const valueToStore =
              typeof value === "object" ? JSON.stringify(value) : String(value);
            safeSetItem(key, valueToStore);
            console.log(
              `Импортировано ${key}: ${valueToStore.substring(0, 50)}...`
            );
          }
        });
      }

      // Импортируем watchlist и subscribed_actors
      if (
        typeof parsedData.watchlistData === "object" &&
        parsedData.watchlistData !== null
      ) {
        // Импорт watchlist
        if (parsedData.watchlistData.hasOwnProperty(WATCHLIST_STORAGE_KEY)) {
          const watchlistItems =
            parsedData.watchlistData[WATCHLIST_STORAGE_KEY];
          if (Array.isArray(watchlistItems)) {
            localStorage.setItem(
              WATCHLIST_STORAGE_KEY,
              JSON.stringify(watchlistItems)
            );
            console.log(
              `Импортирован watchlist: ${watchlistItems.length} элементов`
            );
          } else {
            console.warn(
              `Ожидался массив для ключа ${WATCHLIST_STORAGE_KEY}, получен ${typeof watchlistItems}`
            );
          }
        }

        // Импорт subscribed_actors
        if (
          parsedData.watchlistData.hasOwnProperty(SUBSCRIBED_ACTORS_STORAGE_KEY)
        ) {
          const actorItems =
            parsedData.watchlistData[SUBSCRIBED_ACTORS_STORAGE_KEY];
          if (Array.isArray(actorItems)) {
            localStorage.setItem(
              SUBSCRIBED_ACTORS_STORAGE_KEY,
              JSON.stringify(actorItems)
            );
            console.log(
              `Импортированы subscribed_actors: ${actorItems.length} элементов`
            );
          } else {
            console.warn(
              `Ожидался массив для ключа ${SUBSCRIBED_ACTORS_STORAGE_KEY}, получен ${typeof actorItems}`
            );
          }
        }
      } else {
        console.warn(
          "Раздел watchlistData отсутствует или имеет неверный формат в импортируемом файле."
        );
      }

      setImportExportMessage({
        type: "success",
        text: "Данные успешно импортированы! Страница будет перезагружена.",
      });
      playSound("import_success.mp3");

      // Перезагружаем страницу, чтобы применить изменения
      setTimeout(() => {
        window.location.reload();
      }, 2000); // Небольшая задержка, чтобы пользователь увидел сообщение
    } catch (error: any) {
      console.error("Ошибка при импорте данных:", error);
      setImportExportMessage({
        type: "error",
        text: `Ошибка импорта: ${
          error.message || "Не удалось прочитать файл."
        }`,
      });
      playSound("error.mp3");
      // Скрываем сообщение через некоторое время
      setTimeout(() => setImportExportMessage(null), 5000);
    }
  };

  // Обработчик выбора файла
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === "string") {
        importDataFromJson(content);
      } else {
        setImportExportMessage({
          type: "error",
          text: "Не удалось прочитать содержимое файла.",
        });
        playSound("error.mp3");
        setTimeout(() => setImportExportMessage(null), 5000);
      }
    };
    reader.onerror = () => {
      setImportExportMessage({
        type: "error",
        text: "Ошибка при чтении файла.",
      });
      playSound("error.mp3");
      setTimeout(() => setImportExportMessage(null), 5000);
    };
    reader.readAsText(file);

    // Сбрасываем значение input, чтобы можно было выбрать тот же файл снова
    event.target.value = "";
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "account":
        return (
          <div>
            <h3 className="text-white font-bold text-xl mb-6">Аккаунт</h3>
            <div className="mb-6 p-5 bg-gradient-to-br from-white/5 to-white/10 rounded-lg border border-white/10 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold text-3xl flex-shrink-0">
                  {nameInitial || <User className="w-8 h-8" />}
                </div>
                <div>
                  <p className="text-white font-medium text-xl">
                    {username || "Пользователь"}
                  </p>
                  <p className="text-gray-400 text-sm">Локальный профиль</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowNameModal(true);
                  playSound("toggle_on.mp3");
                }}
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-md hover:shadow-lg mt-4 md:mt-0 md:ml-auto"
              >
                <Edit className="w-4 h-4" />
                Изменить имя
              </button>
            </div>

            <div className="mb-6 p-5 bg-gradient-to-br from-white/5 to-white/10 rounded-lg border border-white/10 shadow-sm">
              <h4 className="text-white font-medium mb-4 border-b border-white/10 pb-2">
                Управление данными
              </h4>
              {/* Сообщение о результате импорта/экспорта */}
              {importExportMessage && (
                <div
                  className={`p-3 rounded-md mb-4 text-sm ${
                    importExportMessage.type === "success"
                      ? "bg-green-500/20 text-green-300 border border-green-500/30"
                      : "bg-red-500/20 text-red-300 border border-red-500/30"
                  }`}
                >
                  {importExportMessage.text}
                </div>
              )}
              <div className="flex flex-wrap gap-4">
                {/* Кнопка Экспорт */}
                <button
                  onClick={exportDataToJson}
                  className="bg-teal-600/30 hover:bg-teal-500/40 text-teal-200 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 border border-teal-500/40 shadow-sm hover:shadow-md"
                >
                  <Download size={16} />
                  Экспорт данных (JSON)
                </button>

                {/* Кнопка Импорт */}
                <button
                  onClick={() => fileInputRef.current?.click()} // Открываем диалог выбора файла
                  className="bg-purple-600/30 hover:bg-purple-500/40 text-purple-200 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 border border-purple-500/40 shadow-sm hover:shadow-md"
                >
                  <Upload size={16} />
                  Импорт данных (JSON)
                </button>
                {/* Скрытый input для выбора файла */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
                />

                {/* Кнопка "Показать приветствие снова" остается */}
                <button
                  className="bg-blue-600/30 hover:bg-blue-500/40 text-blue-200 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5 border border-blue-500/40 shadow-sm hover:shadow-md"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      localStorage.removeItem("hasVisited");
                      localStorage.removeItem("hasCompletedWelcome");
                      window.location.reload();
                      playSound("action.mp3");
                    }
                  }}
                >
                  <Repeat size={16} />
                  Показать приветствие
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Экспорт создает резервную копию ваших настроек интерфейса/звука
                и списков избранного/просмотренного. Импорт позволяет
                восстановить их из ранее сохраненного файла.
              </p>
            </div>
          </div>
        );
      case "interface":
        return (
          <div>
            <h3 className="text-white font-bold text-xl mb-6">
              Настройки интерфейса
            </h3>
            <SettingToggle
              id="show-titles"
              label="Названия фильмов под постерами"
              description='Отображать название и год фильма под постерами в разделе "Обзор"'
              checked={showTitles}
              onChange={setShowTitles}
            />
            <SettingToggle
              id="movie-rating"
              label="Рейтинг на обложках фильмов"
              description='Отображать оценку фильма на обложках в разделе "Обзор"'
              checked={showMovieRating}
              onChange={setShowMovieRating}
            />
            <SettingToggle
              id="rounded-corners"
              label="Закругленные углы обложек"
              description='Использовать закругленные углы для обложек фильмов в разделе "Обзор"'
              checked={roundedCorners}
              onChange={setRoundedCorners}
            />
            <SettingToggle
              id="yellow-hover"
              label="Желтая обводка постеров"
              description="Использовать желтую обводку при наведении на постеры (вместо белой)"
              checked={yellowHover}
              onChange={setYellowHover}
            />
            <SettingToggle
              id="dynamic-backdrop"
              label="Динамическая смена фона"
              description="Автоматически менять фоновое изображение фильма каждые 10 секунд"
              checked={dynamicBackdrop}
              onChange={setDynamicBackdrop}
            />
            <SettingToggle
              id="disable-color-overlay"
              label="Отключить цветные градиенты"
              description="Отключить цветные градиенты на страницах фильмов для улучшения производительности"
              checked={disableColorOverlay}
              onChange={setDisableColorOverlay}
            />
            {/* Добавляем переключатель для свечения */}
            <SettingToggle
              id="card-glow"
              label="Эффект свечения карточек"
              description="Добавляет легкое свечение сверху карточек при наведении в разделах 'Обзор' и 'Популярное'"
              checked={showCardGlow}
              onChange={toggleCardGlow}
            />
            <hr className="border-white/10 my-6" />
          </div>
        );
      case "sound":
        return (
          <div>
            <h3 className="text-white font-bold text-xl mb-6">
              Настройки звука
            </h3>
            <SettingToggle
              id="sound-effects"
              label="Звуковые эффекты интерфейса"
              description="Воспроизводить звуки при взаимодействии с элементами (клики, наведение и т.д.)"
              checked={enableSoundEffects}
              onChange={setEnableSoundEffects}
            />
          </div>
        );
      case "content":
        return (
          <div>
            <h3 className="text-white font-bold text-xl mb-6">
              Настройки контента
            </h3>
            <p className="text-gray-400 bg-gradient-to-br from-white/5 to-white/10 p-5 rounded-lg border border-white/10 shadow-sm">
              Настройки отображения контента будут доступны в ближайшем
              обновлении.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  // Оборачиваем весь рендер в Suspense
  return (
    <Suspense fallback={<ProfilePageFallback />}>
      <ProfilePageContent
        username={username}
        setUsername={setUsername}
        isLoaded={isLoaded}
        mounted={mounted}
        setMounted={setMounted}
        nameInitial={nameInitial}
        setNameInitial={setNameInitial}
        showNameModal={showNameModal}
        setShowNameModal={setShowNameModal}
        tempUsername={tempUsername}
        setTempUsername={setTempUsername}
        showMovieRating={showMovieRating}
        setShowMovieRating={setShowMovieRating}
        enableSoundEffects={enableSoundEffects}
        setEnableSoundEffects={setEnableSoundEffects}
        roundedCorners={roundedCorners}
        setRoundedCorners={setRoundedCorners}
        showTitles={showTitles}
        setShowTitles={setShowTitles}
        yellowHover={yellowHover}
        setYellowHover={setYellowHover}
        dynamicBackdrop={dynamicBackdrop}
        setDynamicBackdrop={setDynamicBackdrop}
        disableColorOverlay={disableColorOverlay}
        setDisableColorOverlay={setDisableColorOverlay}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        importExportMessage={importExportMessage}
        setImportExportMessage={setImportExportMessage}
        fileInputRef={fileInputRef}
        saveUsername={saveUsername}
        resetSettings={resetSettings}
        exportDataToJson={exportDataToJson}
        importDataFromJson={importDataFromJson}
        handleFileChange={handleFileChange}
        renderTabContent={renderTabContent}
        showCardGlow={showCardGlow}
        toggleCardGlow={toggleCardGlow}
      />
    </Suspense>
  );
}

// Простой компонент для Fallback во время загрузки
function ProfilePageFallback() {
  return (
    <GradientBackground>
      <main className="px-6 pt-24 pb-16 text-white min-h-screen">
        <div className="animate-pulse">
          <div className="h-10 w-1/2 bg-gray-700 rounded mb-10"></div>
          <div className="flex flex-col md:flex-row gap-12">
            <aside className="w-full md:w-1/4 lg:w-1/5 flex-shrink-0">
              <div className="bg-gradient-to-b from-white/5 to-transparent p-5 rounded-lg border border-white/10 sticky top-24 shadow-lg space-y-2">
                <div className="h-10 bg-gray-600 rounded"></div>
                <div className="h-10 bg-gray-600 rounded"></div>
                <div className="h-10 bg-gray-600 rounded"></div>
                <div className="h-10 bg-gray-600 rounded"></div>
                <div className="pt-4 mt-4 border-t border-white/10">
                  <div className="h-10 bg-gray-600 rounded"></div>
                </div>
              </div>
            </aside>
            <section className="w-full md:w-3/4 lg:w-4/5 bg-gradient-to-br from-white/5 to-transparent p-8 rounded-lg border border-white/10 shadow-xl">
              <div className="h-8 w-1/3 bg-gray-700 rounded mb-6"></div>
              <div className="h-24 bg-gray-700 rounded mb-6"></div>
              <div className="h-40 bg-gray-700 rounded"></div>
            </section>
          </div>
        </div>
      </main>
    </GradientBackground>
  );
}

// Выносим основной контент страницы в отдельный компонент,
// чтобы можно было использовать хуки внутри него
function ProfilePageContent(props: any) {
  const {
    username,
    setUsername,
    isLoaded,
    mounted,
    setMounted,
    nameInitial,
    setNameInitial,
    showNameModal,
    setShowNameModal,
    tempUsername,
    setTempUsername,
    showMovieRating,
    setShowMovieRating,
    enableSoundEffects,
    setEnableSoundEffects,
    roundedCorners,
    setRoundedCorners,
    showTitles,
    setShowTitles,
    yellowHover,
    setYellowHover,
    dynamicBackdrop,
    setDynamicBackdrop,
    disableColorOverlay,
    setDisableColorOverlay,
    activeTab,
    setActiveTab,
    importExportMessage,
    setImportExportMessage,
    fileInputRef,
    saveUsername,
    resetSettings,
    exportDataToJson,
    importDataFromJson,
    handleFileChange,
    renderTabContent,
    showCardGlow,
    toggleCardGlow,
  } = props;

  // Вся логика и рендеринг, которые были в ProfilePage, теперь здесь
  // (useEffect и функции теперь нужно будет получать из props или перенести сюда)
  // Для простоты, предположим, что вся логика остается в ProfilePage,
  // а ProfilePageContent просто рендерит JSX

  return (
    <GradientBackground>
      <main className="px-6 pt-24 pb-16 text-white min-h-screen">
        <div className="">
          <div className="mb-10 flex items-center gap-3">
            <Settings className="text-yellow-400 flex-shrink-0" size={28} />
            <h1 className="text-2xl md:text-3xl uppercase tracking-wide font-bebas-neue relative pb-2">
              Настройки профиля
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent"></div>
            </h1>
          </div>
          <div className="flex flex-col md:flex-row gap-12">
            {/* Левая колонка с вкладками */}
            <aside className="w-full md:w-1/4 lg:w-1/5 flex-shrink-0">
              <nav className="bg-gradient-to-b from-white/5 to-transparent p-5 rounded-lg border border-white/10 sticky top-24 shadow-lg">
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => props.setActiveTab("account")}
                      className={`w-full text-left px-4 py-3 rounded-md flex items-center gap-3 transition-all duration-200 ${
                        props.activeTab === "account"
                          ? "bg-yellow-500 text-black font-semibold shadow-md scale-[1.02]"
                          : "text-gray-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <User size={18} />
                      <span>Аккаунт</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => props.setActiveTab("interface")}
                      className={`w-full text-left px-4 py-3 rounded-md flex items-center gap-3 transition-all duration-200 ${
                        props.activeTab === "interface"
                          ? "bg-yellow-500 text-black font-semibold shadow-md scale-[1.02]"
                          : "text-gray-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Palette size={18} />
                      <span>Интерфейс</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => props.setActiveTab("sound")}
                      className={`w-full text-left px-4 py-3 rounded-md flex items-center gap-3 transition-all duration-200 ${
                        props.activeTab === "sound"
                          ? "bg-yellow-500 text-black font-semibold shadow-md scale-[1.02]"
                          : "text-gray-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Volume2 size={18} />
                      <span>Звук</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => props.setActiveTab("content")}
                      className={`w-full text-left px-4 py-3 rounded-md flex items-center gap-3 transition-all duration-200 ${
                        props.activeTab === "content"
                          ? "bg-yellow-500 text-black font-semibold shadow-md scale-[1.02]"
                          : "text-gray-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <FileText size={18} />
                      <span>Контент</span>
                    </button>
                  </li>
                  {/* Кнопка сброса настроек */}
                  <li className="pt-4 mt-4 border-t border-white/10">
                    <button
                      onClick={props.resetSettings}
                      className="w-full text-left px-4 py-3 rounded-md flex items-center gap-3 transition-all duration-200 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Repeat size={18} />
                      <span>Сбросить настройки</span>
                    </button>
                  </li>
                </ul>
              </nav>
            </aside>

            {/* Правая колонка с контентом вкладки */}
            <section className="w-full md:w-3/4 lg:w-4/5 bg-gradient-to-br from-white/5 to-transparent p-8 rounded-lg border border-white/10 shadow-xl">
              {props.renderTabContent()}
            </section>
          </div>
        </div>
      </main>

      {/* Модальное окно для ввода имени (перенесено сюда) */}
      {props.showNameModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-700 shadow-xl relative">
            <button
              onClick={() => {
                props.setShowNameModal(false);
                playSound("close_modal.mp3");
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl text-white font-bold mb-4">
              Изменить имя пользователя
            </h2>
            <p className="text-gray-300 mb-4">Как к вам обращаться?</p>

            <input
              type="text"
              value={props.tempUsername}
              onChange={(e) => props.setTempUsername(e.target.value)}
              placeholder="Введите ваше имя"
              className="w-full p-3 bg-gray-800 text-white rounded-lg mb-4 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && props.tempUsername.trim()) {
                  props.saveUsername(props.tempUsername);
                }
              }}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  props.setShowNameModal(false);
                  playSound("cancel.mp3");
                }}
                className="px-4 py-2 rounded-lg text-gray-300 bg-gray-700/50 hover:bg-gray-600/70 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => props.saveUsername(props.tempUsername)}
                disabled={!props.tempUsername.trim()}
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  props.tempUsername.trim()
                    ? "bg-yellow-500 hover:bg-yellow-400 text-black"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </GradientBackground>
  );
}
