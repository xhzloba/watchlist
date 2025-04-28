import Link from "next/link";
import { getImageUrl } from "@/lib/tmdb";

interface MovieListProps {
  movies: any[];
}

export default function MovieList({ movies }: MovieListProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {movies.map((movie) => (
        <Link key={movie.id} href={`/movie/${movie.id}`} className="group">
          <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 border-[3px] border-transparent group-hover:border-white transition-all duration-300 shadow-lg">
            <img
              src={getImageUrl(movie.poster_path, "w500")}
              alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <h3 className="text-sm font-medium text-white truncate">
            {movie.title}
          </h3>
          {movie.release_date && (
            <p className="text-xs text-gray-400">
              {movie.release_date.split("-")[0]}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}
