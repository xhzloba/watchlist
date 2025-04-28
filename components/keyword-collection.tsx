"use client";

import { useRouter } from "next/navigation";
import { ChevronRightCircle } from "lucide-react";
import MovieRow from "@/components/movie-row";
import type { Movie } from "@/lib/tmdb";
import { playSound } from "@/lib/sound-utils";

interface KeywordCollectionProps {
  title: string;
  keywordIds: number[];
  description?: string;
  movies: Movie[];
  variant?: "poster" | "backdrop";
  useTrailerStyle?: boolean;
  showYear?: boolean;
  showLogo?: boolean;
}

export default function KeywordCollection({
  title,
  keywordIds,
  description,
  movies,
  variant = "poster",
  useTrailerStyle = false,
  showYear = true,
  showLogo = false,
}: KeywordCollectionProps) {
  const router = useRouter();

  const handleShowAll = () => {
    if (keywordIds && keywordIds.length > 0) {
      const route = `/keywords/${keywordIds.join(",")}`;
      router.push(route);
    }
  };

  return (
    <div>
      <div className="px-6 mb-4">
        <div className="flex flex-col">
          <div className="flex items-center">
            <h2 className="text-xl uppercase tracking-wide font-bebas-neue pb-2 pr-2 relative border-b-0">
              {title}
              <div className="absolute left-0 right-[60%] bottom-0 h-px bg-gradient-to-r from-yellow-500/40 via-yellow-500/40 to-transparent"></div>
            </h2>
            {keywordIds && (
              <ChevronRightCircle
                className="w-6 h-6 text-yellow-500 cursor-pointer hover:text-yellow-400 transition-colors self-start mt-1"
                onClick={handleShowAll}
              />
            )}
          </div>
        </div>
      </div>
      <MovieRow
        title={title}
        items={movies}
        variant={variant}
        posterSize="large"
        showDate={variant === "poster"}
        showLogo={showLogo}
        showYear={showYear}
        keywordIds={keywordIds}
        hideTitle
        backdropStyle={useTrailerStyle}
        isTrailerSection={false}
        onMovieClick={() => playSound("choose.mp3")}
      />
    </div>
  );
}
