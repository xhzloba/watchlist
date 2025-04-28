"use client";

import { useRef } from "react";
import Image from "next/image";
import { getImageUrl } from "@/lib/tmdb";

export default function ImageSlider({
  title,
  images,
  actorName,
}: {
  title: string;
  images: any[];
  actorName: string;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -600, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 600, behavior: "smooth" });
    }
  };

  return (
    <div className="mt-8">
      <div className="mb-2 px-6 flex items-center">
        <h2 className="text-xl uppercase tracking-wide font-bebas-neue pb-2 pr-8 inline-block relative">
          {title}
          <div className="absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent"></div>
        </h2>
      </div>
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-hide"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {images.map((image: any, index: number) => (
            <div
              key={`image-${index}`}
              className="flex-none w-[180px] md:w-[220px] relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 transition-all duration-300 hover:brightness-110 hover:shadow-lg hover:shadow-white/10 group cursor-pointer"
              style={{ scrollSnapAlign: "start" }}
            >
              <Image
                src={getImageUrl(image.file_path, "w342")}
                alt={`${actorName} - фото ${index + 1}`}
                fill
                sizes="(max-width: 640px) 180px, 220px"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>

        {/* Навигационные кнопки */}
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black/50 p-2 rounded-r-lg text-white opacity-50 hover:opacity-100 transition-opacity z-10"
          aria-label="Прокрутить влево"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black/50 p-2 rounded-l-lg text-white opacity-50 hover:opacity-100 transition-opacity z-10"
          aria-label="Прокрутить вправо"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
