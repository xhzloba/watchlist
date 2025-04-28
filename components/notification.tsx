"use client";

import { useState, useEffect } from "react";
import { X, Check, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type NotificationType = "success" | "error" | "info";

interface NotificationProps {
  message: string;
  type?: NotificationType;
  duration?: number;
  onClose: () => void;
  visible: boolean;
  position?: "global" | "local" | "poster";
}

export default function Notification({
  message,
  type = "success",
  duration = 3000,
  onClose,
  visible,
  position = "global",
}: NotificationProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  // Определяем иконку и цвета в зависимости от типа уведомления
  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          icon: <Check className="w-5 h-5" />,
          bgColor: "bg-green-500",
          textColor: "text-white",
        };
      case "error":
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          bgColor: "bg-red-500",
          textColor: "text-white",
        };
      case "info":
      default:
        return {
          icon: <Check className="w-5 h-5" />,
          bgColor: "bg-yellow-500",
          textColor: "text-black",
        };
    }
  };

  const { icon, bgColor, textColor } = getTypeStyles();

  // Применяем разные стили в зависимости от позиции
  const getPositionStyles = () => {
    switch (position) {
      case "local":
        return "w-full max-w-full mb-4";
      case "poster":
        return "w-full max-w-full mt-2 mb-4";
      case "global":
      default:
        return "fixed top-20 left-1/2 transform -translate-x-1/2 z-50 min-w-[300px] max-w-md";
    }
  };

  const positionClass = getPositionStyles();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={positionClass}
        >
          <div
            className={`${bgColor} ${textColor} px-4 py-3 rounded-lg shadow-lg flex items-center gap-3`}
          >
            <div className="flex-shrink-0">{icon}</div>
            <div className="flex-grow">{message}</div>
            <button
              onClick={onClose}
              className="flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
