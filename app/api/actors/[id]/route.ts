import { getActorInfo } from "@/lib/tmdb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actorId = parseInt(params.id);

    if (isNaN(actorId) || actorId <= 0) {
      return NextResponse.json(
        { error: "Некорректный ID актера" },
        { status: 400 }
      );
    }

    const actorInfo = await getActorInfo(actorId);

    if (!actorInfo) {
      return NextResponse.json(
        { error: "Информация об актере не найдена" },
        { status: 404 }
      );
    }

    return NextResponse.json(actorInfo);
  } catch (error) {
    console.error(`Ошибка при получении информации об актере:`, error);
    return NextResponse.json(
      { error: "Ошибка при получении данных об актере" },
      { status: 500 }
    );
  }
}
