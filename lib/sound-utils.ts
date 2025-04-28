// Утилита для воспроизведения звуков
export function playSound(soundName: string): void {
  if (typeof window !== "undefined") {
    try {
      // Проверяем настройку звука
      const soundEnabled = localStorage.getItem(
        "settings_enable_sound_effects"
      );

      // Если звук выключен, ничего не воспроизводим
      if (soundEnabled !== "true") {
        return;
      }

      const audio = new Audio(`/sounds/${soundName}`);
      audio.volume = 0.3; // Уменьшаем громкость звука
      audio.play().catch((e) => {
        // Игнорируем ошибки воспроизведения звука
        console.log("Не удалось воспроизвести звук:", e);
      });
    } catch (error) {
      console.log("Ошибка воспроизведения звука:", error);
    }
  }
}
