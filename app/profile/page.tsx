"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import Header from "@/components/header";
import GradientBackground from "@/components/gradient-background";
import { playSound } from "@/lib/sound-utils";
import { STORAGE_KEYS } from "@/lib/constants"; // Импортируем константы ключей

// Ключи localStorage для настроек (дублируем здесь, т.к. они убраны из хедера)
// В идеале вынести в общий файл констант, если еще не сделано
const SETTINGS_KEYS = {
  SHOW_MOVIE_RATING: "settings_show_movie_rating",
  ENABLE_SOUND_EFFECTS: "settings_enable_sound_effects",
  ROUNDED_CORNERS: "settings_rounded_corners",
  SHOW_TITLES: "settings_show_titles",
  YELLOW_HOVER: "settings_yellow_hover",
  DYNAMIC_BACKDROP: "settings_dynamic_backdrop",
  DISABLE_COLOR_OVERLAY: "settings_disable_color_overlay",
};

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
    console.log(
      `SettingToggle (${id}) onChange called. New state: ${newCheckedState}`
    );
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
  const [activeTab, setActiveTab] = useState("account");

  // Инициализация состояний из localStorage при монтировании
  useEffect(() => {
    setMounted(true);
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
  }, []);

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

  const renderTabContent = () => {
    switch (activeTab) {
      case "account":
        return (
          <div>
            <h3 className="text-white font-bold text-xl mb-6">Аккаунт</h3>
            <div className="mb-6 p-5 bg-gradient-to-br from-white/5 to-white/10 rounded-lg border border-white/10 shadow-sm flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold text-3xl flex-shrink-0">
                {nameInitial || <User size={32} />}
              </div>
              <div>
                <p className="text-white font-medium text-xl">
                  {username || "Гость"}
                </p>
                <p className="text-gray-400 text-sm">Локальный профиль</p>
              </div>
              <button
                className="ml-auto bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-md hover:shadow-lg"
                onClick={() => {
                  setTempUsername(username || ""); // Убедимся, что в инпуте текущее имя
                  setShowNameModal(true);
                  playSound("open_modal.mp3");
                }}
              >
                <Edit size={16} />
                Изменить имя
              </button>
            </div>

            <div className="mb-6 p-5 bg-gradient-to-br from-white/5 to-white/10 rounded-lg border border-white/10 shadow-sm">
              <h4 className="text-white font-medium mb-4 border-b border-white/10 pb-2">
                Действия
              </h4>
              <div className="flex flex-wrap gap-3">
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
                  Показать приветствие снова
                </button>
                {/* Можно добавить кнопку выхода, если будет аутентификация */}
                {/* <button className="bg-red-500/20 hover:bg-red-500/40 text-red-300 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5 border border-red-500/30">
                  <LogOut size={16} />
                  Выйти (Пример)
                </button> */}
              </div>
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

  return (
    <GradientBackground>
      <Header />
      <main className="px-6 pt-24 pb-16 text-white min-h-screen">
        <div className="">
          <h1 className="text-4xl font-bold mb-10 flex items-center gap-3">
            <Settings className="text-yellow-400" size={32} />
            Настройки профиля
          </h1>

          <div className="flex flex-col md:flex-row gap-12">
            {/* Левая колонка с вкладками */}
            <aside className="w-full md:w-1/4 lg:w-1/5 flex-shrink-0">
              <nav className="bg-gradient-to-b from-white/5 to-transparent p-5 rounded-lg border border-white/10 sticky top-24 shadow-lg">
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => setActiveTab("account")}
                      className={`w-full text-left px-4 py-3 rounded-md flex items-center gap-3 transition-all duration-200 ${
                        activeTab === "account"
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
                      onClick={() => setActiveTab("interface")}
                      className={`w-full text-left px-4 py-3 rounded-md flex items-center gap-3 transition-all duration-200 ${
                        activeTab === "interface"
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
                      onClick={() => setActiveTab("sound")}
                      className={`w-full text-left px-4 py-3 rounded-md flex items-center gap-3 transition-all duration-200 ${
                        activeTab === "sound"
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
                      onClick={() => setActiveTab("content")}
                      className={`w-full text-left px-4 py-3 rounded-md flex items-center gap-3 transition-all duration-200 ${
                        activeTab === "content"
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
                      onClick={resetSettings}
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
              {renderTabContent()}
            </section>
          </div>
        </div>
      </main>

      {/* Модальное окно для ввода имени (перенесено сюда) */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-700 shadow-xl relative">
            <button
              onClick={() => {
                setShowNameModal(false);
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
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              placeholder="Введите ваше имя"
              className="w-full p-3 bg-gray-800 text-white rounded-lg mb-4 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && tempUsername.trim()) {
                  saveUsername(tempUsername);
                }
              }}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNameModal(false);
                  playSound("cancel.mp3");
                }}
                className="px-4 py-2 rounded-lg text-gray-300 bg-gray-700/50 hover:bg-gray-600/70 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => saveUsername(tempUsername)}
                disabled={!tempUsername.trim()}
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  tempUsername.trim()
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
