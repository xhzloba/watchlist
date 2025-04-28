"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Динамическая загрузка компонента модального окна
const WelcomeModal = dynamic(() => import("./welcome-modal"), {
  ssr: false,
});

export default function WelcomeModalWrapper() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Устанавливаем флаг, что компонент загружен на клиенте
    setIsClient(true);

    // Для отладки: проверяем URL, если есть параметр reset=welcome,
    // сбрасываем состояние модального окна
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.get("reset") === "welcome") {
        localStorage.removeItem("hasVisited");
        localStorage.removeItem("hasCompletedWelcome");
        // Удаляем параметр из URL, чтобы не сбрасывать при обновлении страницы
        url.searchParams.delete("reset");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, []);

  // Не отображаем ничего на сервере для предотвращения ошибок гидрации
  if (!isClient) return null;

  // На клиенте возвращаем модальное окно
  return <WelcomeModal />;
}
