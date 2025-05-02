"use client";

import { ReactNode, useEffect, useState } from "react";
import { useColorContext } from "@/contexts/color-context";
import { usePathname } from "next/navigation";

export default function GradientBackground({
  children,
}: {
  children: ReactNode;
}) {
  const { colors, isTransitioning } = useColorContext();
  const pathname = usePathname();
  const [isBrowser, setIsBrowser] = useState(false);

  // Генерируем случайные цвета для фона
  const randomizedColors = {
    topLeft: `rgba(${Math.floor(Math.random() * 100)}, ${Math.floor(
      Math.random() * 100
    )}, ${Math.floor(Math.random() * 155)}, 0.8)`,
    topRight: `rgba(${Math.floor(Math.random() * 100)}, ${Math.floor(
      Math.random() * 100
    )}, ${Math.floor(Math.random() * 155)}, 0.8)`,
    bottomLeft: `rgba(${Math.floor(Math.random() * 100)}, ${Math.floor(
      Math.random() * 100
    )}, ${Math.floor(Math.random() * 155)}, 0.8)`,
    bottomRight: `rgba(${Math.floor(Math.random() * 100)}, ${Math.floor(
      Math.random() * 100
    )}, ${Math.floor(Math.random() * 155)}, 1)`,
  };

  // Специальные цвета для страниц актеров
  const actorColors = {
    topLeft: "#1b1c1c",
    topRight: "#202121",
    bottomLeft: "#0e0f10",
    bottomRight: "#0c0c0c",
  };

  // Устанавливаем флаг, что мы в браузере
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  const displayColors = isTransitioning
    ? colors
    : pathname.includes("/movie/")
    ? randomizedColors
    : pathname.includes("/actors/")
    ? actorColors
    : {
        topLeft: "var(--color-ultrablur-tl)",
        topRight: "var(--color-ultrablur-tr)",
        bottomLeft: "var(--color-ultrablur-bl)",
        bottomRight: "var(--color-ultrablur-br)",
      };

  const containerStyle = {
    "--color-ub-tl": displayColors.topLeft,
    "--color-ub-tr": displayColors.topRight,
    "--color-ub-bl": displayColors.bottomLeft,
    "--color-ub-br": displayColors.bottomRight,
    "--color-surface-background-100": "var(--color-surface-background-100)",
  } as React.CSSProperties;

  return (
    <div className="relative min-h-screen" style={containerStyle}>
      {/* Градиентный фон */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `radial-gradient(circle farthest-side at top left, ${displayColors.topLeft}, transparent 70%), 
                          radial-gradient(circle farthest-side at top right, ${displayColors.topRight}, transparent 70%), 
                          radial-gradient(circle farthest-side at bottom right, ${displayColors.bottomRight}, transparent 100%), 
                          radial-gradient(circle farthest-side at bottom left, ${displayColors.bottomLeft}, transparent 70%)`,
          backgroundColor: "var(--color-surface-background-100)",
          transition: "all 1.5s ease-in-out",
        }}
      ></div>

      {/* Содержимое */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
