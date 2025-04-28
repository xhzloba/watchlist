"use client";

import React, { useState, useEffect, useCallback, ReactNode } from "react";
import dynamic from "next/dynamic";
import { createRoot } from "react-dom/client";
import { WatchlistProvider } from "@/contexts/watchlist-context";
import { playSound } from "@/lib/sound-utils";

// Динамический импорт кнопки подписки
const SubscribeActorButton = dynamic(
  () =>
    import("@/components/watchlist-button").then(
      (mod) => mod.SubscribeActorButton
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-10 w-36 rounded-full bg-gray-800/60 animate-pulse"></div>
    ),
  }
);

// Вставляем скрипт для предварительного скрытия биографии до загрузки JS
if (typeof window !== "undefined") {
  // Создаем стиль, который скрывает контейнер биографии
  const style = document.createElement("style");
  style.id = "biography-hide-style";
  style.textContent = `
    .biography-container {
      visibility: hidden;
      opacity: 0;
    }
    .biography-container.biography-ready {
      visibility: visible;
      opacity: 1;
      transition: opacity 0.3s ease-in-out;
    }
  `;

  // Вставляем стиль в начало документа
  document.head.insertBefore(style, document.head.firstChild);

  // Добавляем проверку, чтобы показать биографию, если JS не загрузился корректно
  setTimeout(() => {
    const biographyContainer = document.querySelector(".biography-container");
    if (
      biographyContainer &&
      !biographyContainer.classList.contains("biography-ready")
    ) {
      biographyContainer.classList.add("biography-ready");
      console.log("Принудительно отображаем биографию по таймауту");
    }
  }, 2000);
}

interface ActorPageWrapperProps {
  params: { id: string };
  children: ReactNode;
}

export default function ActorPageWrapper({
  params,
  children,
}: ActorPageWrapperProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Проверка статуса подписки
  const checkSubscription = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        const subscribedActors = JSON.parse(
          localStorage.getItem("subscribed_actors") || "[]"
        );
        const actorId = parseInt(params.id);
        const isActorSubscribed = subscribedActors.some(
          (actor: any) => actor.id === actorId
        );
        setIsSubscribed(isActorSubscribed);
      } catch (e) {
        console.error("Ошибка при проверке статуса подписки:", e);
      }
    }
  }, [params.id]);

  // Инициализация и слушатель событий
  useEffect(() => {
    checkSubscription();

    // Слушаем событие изменения подписки
    const handleSubscriptionChange = () => {
      checkSubscription();
    };

    document.addEventListener(
      "actorSubscriptionChange",
      handleSubscriptionChange
    );

    // Заменяем заглушку на кнопку подписки - безопасная версия
    const replaceButtonPlaceholder = () => {
      try {
        console.log("Заменяем placeholder кнопки подписки");
        // Проверяем, что в DOM присутствует контейнер для кнопки
        const container = document.getElementById("subscribe-button-container");
        if (!container) {
          console.error("Контейнер для кнопки подписки не найден в DOM");
          return;
        }

        // Получаем родительский элемент контейнера кнопки, чтобы правильно его позиционировать
        const containerParent = container.parentElement;

        // Добавляем проверку на существование containerParent
        if (containerParent) {
          // Получаем предыдущий и следующий элементы для правильного позиционирования
          const prevSibling = container.previousElementSibling;
          const nextSibling = container.nextElementSibling;

          // Если информация о рождении находится после кнопки подписки,
          // и это биография, то мы должны поменять порядок, чтобы
          // кнопка была после информации о рождении, но перед биографией
          if (
            prevSibling &&
            prevSibling.querySelector("h1") &&
            nextSibling &&
            nextSibling.querySelector(".text-gray-300.text-sm.leading-relaxed")
          ) {
            // Если параграф с информацией о рождении есть
            const birthInfo = containerParent.querySelector(
              ".text-gray-300.mb-4"
            );
            if (birthInfo && birthInfo !== prevSibling) {
              try {
                // Перемещаем контейнер кнопки после информации о рождении
                if (birthInfo.nextSibling) {
                  containerParent.insertBefore(
                    container,
                    birthInfo.nextSibling
                  );
                } else {
                  containerParent.appendChild(container);
                }
              } catch (e) {
                console.error("Ошибка при перемещении кнопки подписки:", e);
              }
            }
          }
        }

        // Получаем ID актера
        const actorId = parseInt(params.id);

        // Получаем имя актера из DOM
        const nameElement = document.querySelector("h1.text-3xl.md\\:text-4xl");
        const actorName = nameElement ? nameElement.textContent || "" : "";

        // Получаем путь к изображению актера из DOM
        let profilePath = "";
        try {
          // Ищем изображение актера в DOM
          const imgElement = document.querySelector(
            ".w-full.md\\:w-1\\/5.lg\\:w-1\\/6 .relative img"
          );
          if (imgElement && imgElement instanceof HTMLImageElement) {
            const srcValue = imgElement.src;
            // Извлекаем имя файла из URL
            if (srcValue) {
              const urlParts = srcValue.split("/");
              // Берем последнюю часть URL (имя файла)
              profilePath = urlParts[urlParts.length - 1];
              // Если есть параметры URL (например, ?v=123), убираем их
              profilePath = profilePath.split("?")[0];
              console.log("Извлечен путь к изображению актера:", profilePath);
            }
          }
        } catch (imgError) {
          console.error("Ошибка при извлечении пути к изображению:", imgError);
        }

        // Получаем информацию о социальных сетях актера
        const socialContainer = document.querySelector(
          ".social-media-container"
        );
        if (socialContainer) {
          // Находим и изменяем класс иконок для увеличения размера
          const socialLinks = socialContainer.querySelectorAll("a");
          socialLinks.forEach((link) => {
            // Удаляем обработчик звука при наведении
            link.classList.add("w-12", "h-12");
            const svg = link.querySelector("svg");
            if (svg) {
              svg.classList.remove("w-[22px]", "h-[22px]");
              svg.classList.add("w-6", "h-6");
            }
          });
        }

        // Проверяем, что контейнер всё ещё в DOM
        if (document.getElementById("subscribe-button-container")) {
          // Рендерим компонент внутри WatchlistProvider
          const root = createRoot(container);
          root.render(
            <WatchlistProvider>
              <SubscribeActorButton
                actor={{
                  id: actorId,
                  name: actorName,
                  profile_path: profilePath,
                }}
              />
            </WatchlistProvider>
          );
        }
      } catch (error) {
        console.error("Ошибка при замене кнопки подписки:", error);
      }
    };

    // Запускаем замену с небольшой задержкой
    const timerId = setTimeout(replaceButtonPlaceholder, 100);

    // Очищаем таймер при размонтировании
    return () => {
      clearTimeout(timerId);
      document.removeEventListener(
        "actorSubscriptionChange",
        handleSubscriptionChange
      );
    };
  }, [checkSubscription, params.id]);

  // Добавляем логику для раскрытия/скрытия биографии
  useEffect(() => {
    const initBiographyToggle = () => {
      try {
        // Ищем контейнер биографии
        const biographyContainer = document.querySelector(
          ".biography-container"
        );
        if (!biographyContainer) return;

        // Проверяем, что контейнер имеет тип HTMLElement
        if (!(biographyContainer instanceof HTMLElement)) return;

        // Ищем текстовый элемент и кнопку "Подробнее"
        const biographyText =
          biographyContainer.querySelector(".biography-text");
        const readMoreButton =
          biographyContainer.querySelector(".read-more-button");

        if (!biographyText || !readMoreButton) return;
        if (
          !(biographyText instanceof HTMLElement) ||
          !(readMoreButton instanceof HTMLElement)
        )
          return;

        // Сохраняем полный текст биографии
        const fullText = biographyText.textContent || "";

        // Функция для обрезки текста до последнего полного предложения
        const truncateToLastSentence = (text: string, maxWords = 50) => {
          // Разбиваем текст на слова
          const words = text.split(/\s+/);

          // Если текст короче заданного количества слов, возвращаем как есть
          if (words.length <= maxWords) return text;

          // Берем первые maxWords слов и собираем их обратно в текст
          const truncated = words.slice(0, maxWords).join(" ");

          // Находим последнее полное предложение
          const lastPeriod = truncated.lastIndexOf(".");
          const lastExclamation = truncated.lastIndexOf("!");
          const lastQuestion = truncated.lastIndexOf("?");

          // Берем максимальный индекс из трех вариантов
          const lastSentenceEnd = Math.max(
            lastPeriod,
            lastExclamation,
            lastQuestion
          );

          // Если нашли конец предложения, обрезаем до него, иначе используем все maxWords слов
          let result;
          if (lastSentenceEnd > truncated.length / 3) {
            // Убедимся, что обрезка не слишком короткая
            result = truncated.substring(0, lastSentenceEnd + 1);
          } else {
            // Если предложение слишком короткое или не найдено, просто берем все слова
            result = truncated;
          }

          return result + "...";
        };

        // Создаем сокращенную версию текста
        const truncatedText = truncateToLastSentence(fullText);

        // НОВЫЙ ПОДХОД: Заменяем сложную логику с наложением на простую работу с одним элементом

        // Обновляем стили для более надежной работы
        biographyText.style.transition = "max-height 0.5s ease-in-out";
        biographyText.style.overflow = "hidden";

        // Устанавливаем начальную максимальную высоту для контейнера с текстом
        biographyText.style.maxHeight = "100px"; // Фиксированная высота для обрезанного текста

        // Устанавливаем сокращенный текст
        biographyText.textContent = truncatedText;

        // Показываем биографию после обработки
        biographyContainer.classList.add("biography-ready");

        // Флаг для отслеживания состояния (развернуто/свернуто)
        let isExpanded = false;

        // Обработчик для кнопки "Подробнее"
        readMoreButton.addEventListener("click", () => {
          isExpanded = !isExpanded;

          // Находим иконку стрелки и текстовый элемент
          const arrowIcon = readMoreButton.querySelector(".arrow-icon");
          const buttonText = readMoreButton.querySelector(".button-text");

          if (isExpanded) {
            // Показываем полный текст
            biographyText.textContent = fullText;
            biographyText.style.maxHeight = "10000px"; // Достаточно большое значение для любого текста

            // Изменяем текст кнопки
            if (buttonText) {
              buttonText.textContent = "Скрыть";
            }

            // Поворачиваем стрелку вверх
            if (arrowIcon instanceof SVGElement) {
              arrowIcon.style.transform = "rotate(180deg)";
            }
          } else {
            // Возвращаемся к сокращенному тексту
            biographyText.textContent = truncatedText;
            biographyText.style.maxHeight = "100px";

            // Изменяем текст кнопки обратно
            if (buttonText) {
              buttonText.textContent = "Подробнее";
            }

            // Возвращаем стрелку в исходное положение
            if (arrowIcon instanceof SVGElement) {
              arrowIcon.style.transform = "";
            }
          }
        });
      } catch (error) {
        console.error('Ошибка инициализации кнопки "Подробнее":', error);
      }
    };

    // Запускаем с небольшой задержкой, чтобы DOM успел загрузиться
    const timerId = setTimeout(initBiographyToggle, 50);

    return () => {
      clearTimeout(timerId);
    };
  }, []);

  return (
    <>
      <div
        className={isSubscribed ? "actor-subscribed" : "actor-not-subscribed"}
      >
        {children}
      </div>

      {/* Стили для изображения актера в обоих состояниях */}
      <style jsx global>{`
        /* Базовые стили только для аватара актера */
        .actor-subscribed .w-full.md\\:w-1\\/5.lg\\:w-1\\/6 .relative.w-48.h-48,
        .actor-not-subscribed
          .w-full.md\\:w-1\\/5.lg\\:w-1\\/6
          .relative.w-48.h-48,
        .actor-subscribed
          .w-full.md\\:w-1\\/5.lg\\:w-1\\/6
          .relative.md\\:w-52.md\\:h-52,
        .actor-not-subscribed
          .w-full.md\\:w-1\\/5.lg\\:w-1\\/6
          .relative.md\\:w-52.md\\:h-52,
        .actor-subscribed
          .w-full.md\\:w-1\\/5.lg\\:w-1\\/6
          .relative.lg\\:w-56.lg\\:h-56,
        .actor-not-subscribed
          .w-full.md\\:w-1\\/5.lg\\:w-1\\/6
          .relative.lg\\:w-56.lg\\:h-56 {
          border-width: 2px !important;
          border-radius: 50% !important;
          overflow: hidden !important;
          transition: all 0.5s ease-in-out;
        }

        /* Стили для неподписанного состояния - только для аватара */
        .actor-not-subscribed
          .w-full.md\\:w-1\\/5.lg\\:w-1\\/6
          .relative.w-48.h-48,
        .actor-not-subscribed
          .w-full.md\\:w-1\\/5.lg\\:w-1\\/6
          .relative.md\\:w-52.md\\:h-52,
        .actor-not-subscribed
          .w-full.md\\:w-1\\/5.lg\\:w-1\\/6
          .relative.lg\\:w-56.lg\\:h-56 {
          border-color: rgba(255, 255, 255, 0.3) !important;
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.1) !important;
        }

        /* Стили для подписанного состояния - только для аватара */
        .actor-subscribed .w-full.md\\:w-1\\/5.lg\\:w-1\\/6 .relative.w-48.h-48,
        .actor-subscribed
          .w-full.md\\:w-1\\/5.lg\\:w-1\\/6
          .relative.md\\:w-52.md\\:h-52,
        .actor-subscribed
          .w-full.md\\:w-1\\/5.lg\\:w-1\\/6
          .relative.lg\\:w-56.lg\\:h-56 {
          border-color: #eab308 !important;
          box-shadow: 0 0 15px rgba(234, 179, 8, 0.5) !important;
        }

        /* Дополнительные стили для изображения - только для аватара */
        .actor-subscribed .w-full.md\\:w-1\\/5.lg\\:w-1\\/6 .relative img,
        .actor-not-subscribed .w-full.md\\:w-1\\/5.lg\\:w-1\\/6 .relative img {
          border-radius: 50% !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }

        /* Скрываем контейнер биографии до его обработки */
        .biography-container {
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
        }

        /* Класс для показа биографии после обработки */
        .biography-ready {
          opacity: 1;
        }
      `}</style>
    </>
  );
}
