"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

interface PageTransitionProps {
  children: React.ReactNode;
}

// Создаем внутренний компонент, который будет использовать хук
function PageTransitionInner({ children }: PageTransitionProps) {
  const pathname = usePathname();
  // Используем упрощенную версию, без затемнения
  return <>{children}</>;
}

// Основной компонент, который будет оборачивать внутренний в Suspense
export default function PageTransition({ children }: PageTransitionProps) {
  return (
    <Suspense fallback={<>{children}</>}>
      <PageTransitionInner>{children}</PageTransitionInner>
    </Suspense>
  );
}
