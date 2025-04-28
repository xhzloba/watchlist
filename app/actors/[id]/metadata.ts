import { getActorInfo } from "@/lib/tmdb";
import { ACTORS } from "@/lib/actors";
import type { Metadata } from "next";

interface ActorPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: ActorPageProps): Promise<Metadata> {
  const actorId = parseInt(params.id);

  if (isNaN(actorId)) {
    return {
      title: "Актер не найден | HD Planet",
      description: "К сожалению, информация об этом актере не найдена.",
    };
  }

  try {
    // Получаем информацию об актере напрямую из API
    const actorInfo = await getActorInfo(actorId);

    if (!actorInfo) {
      return {
        title: "Актер не найден | HD Planet",
        description: "К сожалению, информация об этом актере не найдена.",
      };
    }

    // Проверяем, есть ли актер в предопределенном списке
    const predefinedActor = ACTORS.find((a) => a.id === actorId);
    const actorName = actorInfo.name;

    // Формируем метаданные
    return {
      title: `${actorName} - Фильмография и биография | HD Planet`,
      description: actorInfo?.biography
        ? `${actorInfo.biography.slice(0, 160)}...`
        : `Биография, фильмография и информация об актере ${actorName}. Смотрите лучшие фильмы с актером на HD Planet.`,
      keywords: `${actorName}, фильмы с ${actorName}, фильмография, биография актера, лучшие фильмы, HD Planet`,
      openGraph: {
        title: `${actorName} - Фильмография и биография | HD Planet`,
        description: actorInfo?.biography
          ? `${actorInfo.biography.slice(0, 160)}...`
          : `Биография, фильмография и информация об актере ${actorName}. Смотрите лучшие фильмы с актером на HD Planet.`,
        url: `/actors/${actorId}`,
        siteName: "HD Planet",
        locale: "ru_RU",
        type: "profile",
      },
    };
  } catch (error) {
    // В случае ошибки возвращаем базовые метаданные
    return {
      title: "Актер | HD Planet",
      description:
        "Фильмография и информация об актере. Смотрите лучшие фильмы с актером на HD Planet.",
    };
  }
}
