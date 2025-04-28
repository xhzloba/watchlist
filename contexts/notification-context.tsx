"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  useEffect,
} from "react";
import Notification, { NotificationType } from "@/components/notification";
import { createPortal } from "react-dom";

interface NotificationContextProps {
  showNotification: (
    message: string,
    type?: NotificationType,
    position?: "global" | "local" | "poster"
  ) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationType;
    visible: boolean;
    position: "global" | "local" | "poster";
  }>({
    message: "",
    type: "success",
    visible: false,
    position: "global",
  });

  // Добавляем ref для постера фильма, чтобы иметь возможность отображать уведомление ниже
  const posterRef = useRef<HTMLDivElement | null>(null);

  // Находим постер на странице
  useEffect(() => {
    if (notification.position === "poster" && notification.visible) {
      // Ищем контейнер постера по более надежному селектору
      // Можно использовать data-атрибут или другие селекторы, которые есть в DOM
      const posterContainer =
        document.querySelector(".relative.aspect-\\[2\\/3\\]") ||
        document.querySelector("[data-poster-container]") ||
        document.querySelector(".overflow-hidden.rounded-lg");

      if (posterContainer) {
        posterRef.current = posterContainer.parentElement as HTMLDivElement;
      } else {
        console.log("Контейнер постера не найден, использую fallback");
        // Fallback - показываем уведомление глобально
        setNotification((prev) => ({
          ...prev,
          position: "global",
        }));
      }
    }
  }, [notification.visible, notification.position]);

  const showNotification = (
    message: string,
    type: NotificationType = "info",
    position: "global" | "local" | "poster" = "global"
  ) => {
    setNotification({
      message,
      type,
      visible: true,
      position,
    });
  };

  const hideNotification = () => {
    setNotification((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  // Отображаем уведомление в зависимости от его позиции
  const renderNotification = () => {
    if (notification.position === "poster" && posterRef.current) {
      // Используем портал для рендеринга уведомления после контейнера постера
      return createPortal(
        <Notification
          message={notification.message}
          type={notification.type}
          visible={notification.visible}
          onClose={hideNotification}
          position="poster"
        />,
        posterRef.current
      );
    }

    return (
      <Notification
        message={notification.message}
        type={notification.type}
        visible={notification.visible}
        onClose={hideNotification}
        position={notification.position}
      />
    );
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {renderNotification()}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
}
