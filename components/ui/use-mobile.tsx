import * as React from "react";

// Константа для мобильного брейкпоинта (768px соответствует md в tailwind)
const MOBILE_BREAKPOINT = 768;
// Константа для планшетного брейкпоинта (1024px соответствует lg в tailwind)
const TABLET_BREAKPOINT = 1024;

// Хук для проверки мобильного устройства (< 768px)
export function useIsMobile() {
  // Начинаем с undefined, чтобы не было несоответствия между SSR и клиентом
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    // Создаем Media Query List для мобильных устройств
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    // Функция для обновления состояния
    const updateMobileStatus = () => {
      setIsMobile(mql.matches);
    };

    // Устанавливаем начальное значение
    updateMobileStatus();

    // Добавляем слушатель событий
    mql.addEventListener("change", updateMobileStatus);

    // Очищаем слушатель при размонтировании компонента
    return () => mql.removeEventListener("change", updateMobileStatus);
  }, []);

  // Если значение еще не определено (во время SSR), предполагаем false
  // Это предотвратит несоответствие при гидратации
  return isMobile ?? false;
}

// Хук для проверки планшетного устройства (≥ 768px и < 1024px)
export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(
    undefined
  );

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

  return isTablet ?? false;
}

// Хук для проверки размера экрана (можно использовать для любого брейкпоинта)
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(query);

    const updateMatches = () => {
      setMatches(mql.matches);
    };

    updateMatches();
    mql.addEventListener("change", updateMatches);

    return () => mql.removeEventListener("change", updateMatches);
  }, [query]);

  return matches ?? false;
}
