import * as React from "react";

// Константа для мобильного брейкпоинта (768px соответствует md в tailwind)
const MOBILE_BREAKPOINT = 768;
// Константа для планшетного брейкпоинта (1024px соответствует lg в tailwind)
const TABLET_BREAKPOINT = 1024;

// Хук для проверки мобильного устройства (< 768px)
export function useIsMobile() {
  // Определяем значение isMobile сразу при инициализации, если доступно window
  const initialIsMobile =
    typeof window !== "undefined"
      ? window.innerWidth < MOBILE_BREAKPOINT
      : false;

  // Используем initialIsMobile вместо undefined для начального значения
  const [isMobile, setIsMobile] = React.useState(initialIsMobile);

  React.useEffect(() => {
    // Создаем Media Query List для мобильных устройств
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    // Функция для обновления состояния
    const updateMobileStatus = () => {
      setIsMobile(mql.matches);
    };

    // Устанавливаем значение немедленно при монтировании
    updateMobileStatus();

    // Добавляем слушатель событий
    mql.addEventListener("change", updateMobileStatus);

    // Очищаем слушатель при размонтировании компонента
    return () => mql.removeEventListener("change", updateMobileStatus);
  }, []);

  return isMobile;
}

// Хук для проверки планшетного устройства (≥ 768px и < 1024px)
export function useIsTablet() {
  // Изменяем также этот хук для согласованности
  const initialIsTablet =
    typeof window !== "undefined"
      ? window.innerWidth >= MOBILE_BREAKPOINT &&
        window.innerWidth < TABLET_BREAKPOINT
      : false;

  const [isTablet, setIsTablet] = React.useState(initialIsTablet);

  React.useEffect(() => {
    // Создаем Media Query List для планшетных устройств
    const mql = window.matchMedia(
      `(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${
        TABLET_BREAKPOINT - 1
      }px)`
    );

    const updateTabletStatus = () => {
      setIsTablet(mql.matches);
    };

    updateTabletStatus();
    mql.addEventListener("change", updateTabletStatus);

    return () => mql.removeEventListener("change", updateTabletStatus);
  }, []);

  return isTablet;
}

// Хук для проверки размера экрана (можно использовать для любого брейкпоинта)
export function useMediaQuery(query: string): boolean {
  // Обновляем также и этот хук для согласованности
  const getInitialValue = () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = React.useState(getInitialValue());

  React.useEffect(() => {
    const mql = window.matchMedia(query);

    const updateMatches = () => {
      setMatches(mql.matches);
    };

    updateMatches();
    mql.addEventListener("change", updateMatches);

    return () => mql.removeEventListener("change", updateMatches);
  }, [query]);

  return matches;
}
