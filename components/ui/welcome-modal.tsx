"use client";

import { useState, useEffect } from "react";
import {
  X,
  Info,
  Film,
  CalendarDays,
  Bell,
  Search,
  ThumbsUp,
  Trophy,
  ClipboardList,
} from "lucide-react";
import { useUsername } from "@/contexts/username-context";

// Компонент отображения фичи в модальном окне
interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconBg?: string;
}

const FeatureItem = ({
  icon,
  title,
  description,
  iconBg = "from-blue-600 to-blue-800",
}: FeatureItemProps) => (
  <div className="flex items-start p-4 rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-blue-500/30 transition-all hover:shadow-lg hover:shadow-blue-900/10">
    <div
      className={`flex-shrink-0 p-2.5 rounded-xl bg-gradient-to-br ${iconBg} shadow-lg mr-4 text-white`}
    >
      {icon}
    </div>
    <div>
      <h3 className="font-medium text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-300">{description}</p>
    </div>
  </div>
);

const WelcomeModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { username, setUsername, isLoaded } = useUsername();

  // Очистка localStorage для тестирования - проверяем раньше основного эффекта
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Если в URL есть параметр reset=all, сбрасываем все настройки
      if (window.location.search.includes("reset=all")) {
        localStorage.clear();
        window.location.href = window.location.pathname; // Перезагружаем без параметров
      }
    }
  }, []);

  useEffect(() => {
    // Проверяем, посещал ли пользователь сайт ранее
    if (isLoaded) {
      // Добавляем проверку на загрузку данных
      const hasVisited = localStorage.getItem("hasVisited");
      const editNameRequest = localStorage.getItem("editNameRequest");
      const hasCompletedWelcome = localStorage.getItem("hasCompletedWelcome");

      // Проверяем, открывался ли профиль для редактирования имени
      if (editNameRequest === "true") {
        // Если редактирование было запрошено из профиля, не показываем это модальное окно
        setIsOpen(false);
        // Очищаем флаг запроса редактирования
        localStorage.removeItem("editNameRequest");
        return;
      }

      if (!hasVisited) {
        // Если это первый визит, показываем приветственное окно (шаг 1)
        setIsOpen(true);
        setStep(1);
        // НЕ устанавливаем hasVisited здесь, чтобы не пропустить приветственный экран
        // при следующем просмотре, если пользователь не завершил поток
      } else if (hasVisited && !hasCompletedWelcome && !username) {
        // Если пользователь уже посещал сайт, но не завершил поток приветствия
        setIsOpen(true);
        setStep(1); // Показываем приветственный экран снова
      } else if (hasVisited && !username) {
        // Если пользователь посещал сайт, завершил приветствие, но не ввел имя,
        // показываем только шаг ввода имени
        setIsOpen(true);
        setStep(2);
      }
    }
  }, [username, isLoaded]);

  const handleClose = () => {
    // Отмечаем, что пользователь видел сайт
    localStorage.setItem("hasVisited", "true");
    setIsOpen(false);
  };

  const handleNextStep = () => {
    // Отмечаем, что пользователь видел приветственный экран
    localStorage.setItem("hasVisited", "true");
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!inputValue.trim()) {
      setError("Пожалуйста, введите ваше имя");
      return;
    }

    if (inputValue.length > 30) {
      setError("Имя не должно превышать 30 символов");
      return;
    }

    setIsSubmitting(true);

    // Сохраняем имя пользователя через контекст
    setUsername(inputValue.trim());

    // Отмечаем, что пользователь полностью завершил поток приветствия
    localStorage.setItem("hasVisited", "true");
    localStorage.setItem("hasCompletedWelcome", "true");

    // Имитация загрузки
    setTimeout(() => {
      setIsSubmitting(false);
      setIsOpen(false);
    }, 500);
  };

  // Если данные еще не загружены, не показываем модальное окно
  if (!isLoaded || !isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-md animate-backdrop-fade-in">
      <div className="relative w-full max-w-2xl mx-4 overflow-hidden rounded-3xl animate-modal-fade-in">
        {/* Фоновый эффект с градиентами */}
        <div className="absolute inset-0 bg-[#0E1424] z-0 opacity-95 rounded-3xl"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-transparent to-indigo-900/30 z-0 rounded-3xl animate-glow"></div>

        {/* Светящиеся элементы для визуального эффекта */}
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-blue-500 rounded-full filter blur-[80px] opacity-20 animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-indigo-500 rounded-full filter blur-[100px] opacity-20 animate-pulse-slow"></div>

        {/* Фоновые элементы дизайна */}
        <div className="absolute w-full h-full opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-400/20 to-transparent rounded-bl-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-indigo-600/20 to-transparent rounded-tr-[100px]"></div>
        </div>

        {/* Декоративные элементы */}
        <div className="absolute top-10 right-10 w-3 h-3 bg-blue-400 rounded-full opacity-40 animate-float-up"></div>
        <div
          className="absolute bottom-20 left-10 w-4 h-4 bg-indigo-500 rounded-full opacity-40 animate-float-up"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-20 left-1/4 w-2 h-2 bg-blue-300 rounded-full opacity-30 animate-float-up"
          style={{ animationDelay: "1.5s" }}
        ></div>

        {/* Кнопка закрытия */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-20 bg-gray-800/50 p-2 rounded-full hover:bg-gray-700/70 hover:scale-110 transition-transform"
        >
          <X size={18} />
        </button>

        {/* Основной контент */}
        <div className="relative z-10 p-8 md:p-10">
          {step === 1 ? (
            // Шаг 1: Описание сайта
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center p-3 mb-4 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl shadow-xl animate-pulse-slow">
                  <Film size={28} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-white">
                  Добро пожаловать в КиноГид
                </h2>
                <p className="text-gray-300 text-sm max-w-lg mx-auto">
                  Рады приветствовать вас на нашей платформе о кино. Исследуйте
                  мир кинематографа с нашими инструментами:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FeatureItem
                  icon={<Search size={20} />}
                  title="Умный поиск фильмов"
                  description="Находите фильмы по названию, актёрам, жанрам и даже ключевым словам из сюжета"
                />
                <FeatureItem
                  icon={<Trophy size={20} />}
                  title="Детальные рейтинги"
                  description="Изучайте топ-100 фильмов всех времен или за конкретный год с подробной статистикой"
                />
                <FeatureItem
                  icon={<ClipboardList size={20} />}
                  title="Персональный Watchlist"
                  description="Добавляйте фильмы в список для просмотра, отмечайте просмотренные и получайте рекомендации"
                />
                <FeatureItem
                  icon={<CalendarDays size={20} />}
                  title="Календарь премьер"
                  description="Интерактивный календарь с датами всех ожидаемых кинопремьер и релизов"
                />
                <FeatureItem
                  icon={<Bell size={20} />}
                  title="Система уведомлений"
                  description="Получайте напоминания о релизах ожидаемых фильмов и новых трейлерах"
                />
                <FeatureItem
                  icon={<ThumbsUp size={20} />}
                  title="Умные рекомендации"
                  description="Алгоритм анализирует ваши предпочтения и предлагает фильмы, которые могут вам понравиться"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={handleNextStep}
                  className="w-full py-4 mt-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium rounded-xl shadow-lg transition-all transform hover:scale-[1.02] hover:shadow-xl duration-300 ease-in-out"
                >
                  Продолжить
                </button>
              </div>
            </div>
          ) : (
            // Шаг 2: Ввод имени
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center p-3 mb-4 bg-gradient-to-br from-indigo-600 to-blue-800 rounded-2xl shadow-xl animate-pulse-slow">
                  <Info size={28} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-white">
                  Как к вам обращаться?
                </h2>
                <p className="text-gray-300 text-sm max-w-lg mx-auto mb-8">
                  Для более персонализированного опыта, введите ваше имя. С ним
                  мы сможем улучшить рекомендации и сделать ваше знакомство с
                  миром кино более приятным.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="mb-8">
                  <div className="relative">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Ваше имя"
                      className={`w-full px-5 py-4 bg-gray-800/70 border-2 ${
                        error
                          ? "border-red-500"
                          : "border-gray-700 focus:border-blue-500"
                      } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-lg backdrop-blur-sm`}
                      autoFocus
                    />
                    {error && (
                      <p className="mt-2 text-red-400 text-sm animate-fadeIn flex items-center">
                        <span className="mr-1">•</span> {error}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Сохранение...
                    </span>
                  ) : (
                    "Начать пользоваться сервисом"
                  )}
                </button>
              </form>

              <p className="mt-6 text-gray-400 text-xs text-center">
                Мы ценим вашу конфиденциальность. Ваше имя хранится локально и
                используется только для персонализации интерфейса.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
