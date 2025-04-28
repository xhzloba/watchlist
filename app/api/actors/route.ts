import { getPopularActors, searchActors } from "@/lib/tmdb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Получаем параметры запроса
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const query = searchParams.get("query") || "";

    // Проверяем корректность номера страницы
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: "Некорректный номер страницы" },
        { status: 400 }
      );
    }

    // Если задан поисковый запрос, выполняем поиск актеров
    // Иначе получаем список популярных актеров
    const actorsData = query.trim()
      ? await searchActors(query, page)
      : await getPopularActors(page);

    // Возвращаем результат
    return NextResponse.json(actorsData);
  } catch (error) {
    console.error("Ошибка при обработке запроса актеров:", error);
    return NextResponse.json(
      { error: "Ошибка при получении данных об актерах" },
      { status: 500 }
    );
  }
}
