"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useMemo,
} from "react";

const SETTINGS_STORAGE_KEY = "uiSettings";

interface UISettings {
  showCardGlow: boolean;
}

interface UISettingsContextType extends UISettings {
  toggleCardGlow: () => void;
}

// Значения по умолчанию
const defaultSettings: UISettings = {
  showCardGlow: false, // По умолчанию свечение выключено
};

const UISettingsContext = createContext<UISettingsContextType | undefined>(
  undefined
);

export const UISettingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<UISettings>(() => {
    // Пытаемся загрузить из localStorage при инициализации (только на клиенте)
    if (typeof window !== "undefined") {
      try {
        const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (storedSettings) {
          const parsed = JSON.parse(storedSettings);
          // Убедимся, что все ключи из defaultSettings присутствуют
          return { ...defaultSettings, ...parsed };
        }
      } catch (error) {
        console.error("Error reading UI settings from localStorage", error);
      }
    }
    return defaultSettings;
  });

  // Эффект для обновления localStorage при изменении настроек
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error("Error saving UI settings to localStorage", error);
      }
    }
  }, [settings]);

  const toggleCardGlow = () => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      showCardGlow: !prevSettings.showCardGlow,
    }));
  };

  // Мемоизируем значение контекста для предотвращения ненужных ререндеров
  const contextValue = useMemo(
    () => ({
      ...settings,
      toggleCardGlow,
    }),
    [settings]
  ); // Зависимость только от settings

  return (
    <UISettingsContext.Provider value={contextValue}>
      {children}
    </UISettingsContext.Provider>
  );
};

// Хук для удобного использования контекста
export const useUISettings = (): UISettingsContextType => {
  const context = useContext(UISettingsContext);
  if (context === undefined) {
    throw new Error("useUISettings must be used within a UISettingsProvider");
  }
  return context;
};
