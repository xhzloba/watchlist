import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json(
      { error: "URL параметр не указан" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(targetUrl);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Ошибка прокси-запроса:", error);
    return NextResponse.json(
      { error: "Ошибка при выполнении запроса" },
      { status: 500 }
    );
  }
}
