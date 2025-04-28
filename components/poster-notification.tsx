"use client";

import { useState, useEffect } from "react";
import { X, Check, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type NotificationType = "success" | "error" | "info";

interface PosterNotificationProps {
  movieId: number;
}

// Создаем глобальное хранилище для уведомлений постеров
const posterNotifications = new Map<
  number,
  {
    message: string;
    type: NotificationType;
    visible: boolean;
    timestamp: number;
  }
>();

// Функция для отображения уведомления для конкретного постера
export function showPosterNotification(
  movieId: number,
  message: string,
  type: NotificationType = "success"
) {
  posterNotifications.set(movieId, {
    message,
    type,
    visible: true,
    timestamp: Date.now(),
  });

  // Создаем пользовательское событие для обновления уведомлений
  const event = new CustomEvent("posterNotificationChange", {
    detail: { movieId, timestamp: Date.now() },
  });
  document.dispatchEvent(event);

  // Автоматически скрываем через 3 секунды
  setTimeout(() => {
    const notification = posterNotifications.get(movieId);
    if (notification && notification.timestamp === Date.now()) {
      posterNotifications.set(movieId, { ...notification, visible: false });
      document.dispatchEvent(new CustomEvent("posterNotificationChange"));
    }
  }, 3000);
}

export default function PosterNotification({
  movieId,
}: PosterNotificationProps) {
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationType;
    visible: boolean;
  }>({
    message: "",
    type: "success",
    visible: false,
  });

  useEffect(() => {
    // Функция для обновления состояния компонента
    const updateNotification = () => {
      const notificationData = posterNotifications.get(movieId);
      if (notificationData) {
        setNotification({
          message: notificationData.message,
          type: notificationData.type,
          visible: notificationData.visible,
        });
      }
    };

    // Вызываем сразу при монтировании
    updateNotification();

    // Слушаем событие изменения уведомлений
    const handleNotificationChange = (e: CustomEvent) => {
      if (!e.detail || e.detail.movieId === movieId) {
        updateNotification();
      }
    };

    document.addEventListener(
      "posterNotificationChange",
      handleNotificationChange as EventListener
    );

    return () => {
      document.removeEventListener(
        "posterNotificationChange",
        handleNotificationChange as EventListener
      );
    };
  }, [movieId]);

  // Остальной код как в обычном компоненте Notification
  // ...
}
