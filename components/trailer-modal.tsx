"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Movie } from "@/lib/tmdb";
import { getMovieVideos } from "@/lib/tmdb";

interface TrailerModalProps {
  movie: Movie;
  onClose: () => void;
}

export default function TrailerModal({ movie, onClose }: TrailerModalProps) {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrailer() {
      try {
        const videos = await getMovieVideos(movie.id.toString());
        const trailer = videos.find((video: any) => video.type === "Trailer");
        if (trailer) {
          setTrailerKey(trailer.key);
        }
      } catch (error) {
        console.error("Error fetching trailer:", error);
      }
    }

    fetchTrailer();
  }, [movie.id]);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      style={{ position: "fixed", marginTop: 0 }}
    >
      <div className="relative w-full max-w-3xl aspect-video">
        {trailerKey ? (
          <iframe
            src={`https://www.youtube.com/embed/${trailerKey}`}
            className="w-full h-full"
            allowFullScreen
          ></iframe>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            Загрузка трейлера...
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
