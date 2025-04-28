"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Массив жанров для отображения их названий
const genres = [
  { id: 28, name: "Боевики" },
  { id: 12, name: "Приключения" },
  { id: 16, name: "Мультфильмы" },
  { id: 35, name: "Комедии" },
  { id: 80, name: "Криминал" },
  { id: 99, name: "Документальные" },
  { id: 18, name: "Драмы" },
  { id: 10751, name: "Семейные" },
  { id: 14, name: "Фэнтези" },
  { id: 36, name: "Исторические" },
  { id: 27, name: "Ужасы" },
  { id: 10402, name: "Музыкальные" },
  { id: 9648, name: "Детективы" },
  { id: 10749, name: "Мелодрамы" },
  { id: 878, name: "Фантастика" },
  { id: 53, name: "Триллеры" },
  { id: 10752, name: "Военные" },
  { id: 37, name: "Вестерны" },
];

// Массив стран
const countries = [
  { code: "RU", name: "России" },
  { code: "US", name: "США" },
  { code: "GB", name: "Великобритании" },
  { code: "FR", name: "Франции" },
  { code: "DE", name: "Германии" },
  { code: "IT", name: "Италии" },
  { code: "JP", name: "Японии" },
  { code: "KR", name: "Южной Кореи" },
  { code: "IN", name: "Индии" },
  { code: "ES", name: "Испании" },
];

export default function DynamicHeading() {
  const searchParams = useSearchParams();
  const [headingText, setHeadingText] = useState("Обзор популярных фильмов");
  const [headingJSX, setHeadingJSX] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    let heading = "";
    let genreElements: React.ReactNode[] = [];
    let yearElement: React.ReactNode | null = null;
    let countryElement: React.ReactNode | null = null;

    const trending = searchParams.get("trending");
    const withGenres = searchParams.get("with_genres");
    const year = searchParams.get("year");
    const country = searchParams.get("with_origin_country");

    // Определяем основную категорию
    if (trending === "day") {
      heading = "Фильмы в тренде сегодня";
    } else if (trending === "week") {
      heading = "Фильмы в тренде за неделю";
    } else {
      heading = "Популярные фильмы";
    }

    // Добавляем год, если он указан
    if (year) {
      yearElement = <span className="text-yellow-400">{year} года</span>;
    }

    // Добавляем выбранные жанры
    if (withGenres) {
      const genreIds = withGenres.split(",").map((id) => parseInt(id, 10));
      const genreNames = genres
        .filter((g) => genreIds.includes(g.id))
        .map((g) => g.name.toLowerCase());

      genreElements = genreNames.map((name, i) => (
        <span key={i} className="text-yellow-400">
          {name}
          {i < genreNames.length - 1 && ", "}
        </span>
      ));
    }

    // Добавляем страну, если она указана
    if (country) {
      const countryName = countries.find((c) => c.code === country)?.name;
      if (countryName) {
        countryElement = <span className="text-yellow-400">{countryName}</span>;
      }
    }

    // Формируем JSX для заголовка
    let finalJSX: React.ReactNode;

    if (withGenres && genreElements.length === 1) {
      // Один жанр в начале
      finalJSX = (
        <>
          {genreElements} {heading.toLowerCase()} {yearElement}{" "}
          {countryElement && <>из {countryElement}</>}
        </>
      );
    } else if (withGenres && genreElements.length > 1) {
      // Несколько жанров
      finalJSX = (
        <>
          {heading.toLowerCase()} {yearElement} в жанрах: {genreElements}{" "}
          {countryElement && <>из {countryElement}</>}
        </>
      );
    } else {
      // Простой заголовок без жанров
      finalJSX = (
        <>
          {heading} {yearElement} {countryElement && <>из {countryElement}</>}
        </>
      );
    }

    // Устанавливаем JSX и текст для SEO
    setHeadingJSX(finalJSX);

    // Продолжаем формировать текст для SEO
    if (year) {
      heading = `${heading} ${year} года`;
    }

    if (withGenres) {
      const genreIds = withGenres.split(",").map((id) => parseInt(id, 10));
      const genreNames = genres
        .filter((g) => genreIds.includes(g.id))
        .map((g) => g.name.toLowerCase());

      if (genreNames.length === 1) {
        heading = `${genreNames[0]} ${heading.toLowerCase()}`;
      } else if (genreNames.length > 1) {
        heading = `${heading.toLowerCase()} в жанрах: ${genreNames.join(", ")}`;
      }
    }

    if (country) {
      const countryName = countries.find((c) => c.code === country)?.name;
      if (countryName) {
        heading = `${heading} из ${countryName}`;
      }
    }

    setHeadingText(heading.charAt(0).toUpperCase() + heading.slice(1));
  }, [searchParams]);

  return (
    <h1 className="text-xl uppercase tracking-wide font-bebas-neue pb-2 relative">
      <span className="relative inline-block">
        {headingJSX || headingText}
        <div className="absolute left-0 bottom-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent"></div>
      </span>
    </h1>
  );
}
