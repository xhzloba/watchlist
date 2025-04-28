import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("URL не указан", { status: 400 });
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return new NextResponse("Ошибка загрузки изображения", {
        status: response.status,
      });
    }

    const buffer = await response.arrayBuffer();
    const headers = new Headers();
    headers.set(
      "Content-Type",
      response.headers.get("Content-Type") || "image/jpeg"
    );
    headers.set("Cache-Control", "public, max-age=600");

    return new NextResponse(buffer, {
      headers,
      status: 200,
    });
  } catch (error) {
    console.error("Ошибка прокси изображения:", error);
    return new NextResponse("Ошибка сервера", { status: 500 });
  }
}
