"use client";

import React, { ReactNode } from "react";
import Link from "next/link";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionText?: string;
  actionLink?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionText,
  actionLink,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 max-w-md mx-auto">
      <div className="mb-4">{icon}</div>
      <h2 className="text-xl font-medium text-gray-300 mb-2">{title}</h2>
      <p className="text-gray-400 mb-6">{description}</p>
      {actionText && actionLink && (
        <Link
          href={actionLink}
          className="inline-block px-6 py-3 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-600 transition-colors"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
}
