"use client";

import { usePathname } from "next/navigation";

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  // Используем упрощенную версию, без затемнения
  return <>{children}</>;
}
