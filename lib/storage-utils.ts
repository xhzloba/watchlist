// Безопасные функции для работы с localStorage
export function safeGetItem(key: string): string | null {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error("Error accessing localStorage:", e);
      return null;
    }
  }
  return null;
}

export function safeSetItem(key: string, value: string): boolean {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error("Error writing to localStorage:", e);
      return false;
    }
  }
  return false;
}
