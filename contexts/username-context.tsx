"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type UsernameContextType = {
  username: string;
  setUsername: (name: string) => void;
  isLoaded: boolean;
};

const UsernameContext = createContext<UsernameContextType | undefined>(
  undefined
);

export const UsernameProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsernameState] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Загружаем имя пользователя из localStorage только на клиенте
    if (typeof window !== "undefined") {
      const savedUsername = localStorage.getItem("username");
      if (savedUsername) {
        setUsernameState(savedUsername);
      }
      setIsLoaded(true);
    }
  }, []);

  const setUsername = (name: string) => {
    setUsernameState(name);
    if (typeof window !== "undefined") {
      localStorage.setItem("username", name);
    }
  };

  // Предоставляем объект контекста даже до загрузки, но с флагом isLoaded
  return (
    <UsernameContext.Provider value={{ username, setUsername, isLoaded }}>
      {children}
    </UsernameContext.Provider>
  );
};

export const useUsername = (): UsernameContextType => {
  const context = useContext(UsernameContext);
  if (context === undefined) {
    throw new Error("useUsername must be used within a UsernameProvider");
  }
  return context;
};
