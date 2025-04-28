"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Play } from "lucide-react"
import type { Movie } from "@/lib/tmdb"
import { Button } from "@/components/ui/button"
import { getImageUrl } from "@/lib/tmdb"

interface HeroSliderProps {
  movies: Movie[]
}

export default function HeroSlider({ movies }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [movies.length])

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % movies.length)
  }

  return (
    <div className="relative h-[70vh] overflow-hidden">
      {movies.map((movie, index) => (
        <div
          key={movie.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
          <Image
            src={getImageUrl(movie.backdrop_path, "original") || "/placeholder.svg"}
            alt={movie.title || movie.name || ""}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 max-w-2xl">{movie.title || movie.name}</h1>
            <p className="text-lg md:text-xl text-gray-200 mb-6 max-w-2xl line-clamp-2">{movie.overview}</p>
            <Button size="lg" className="bg-white text-black hover:bg-white/90">
              <Play className="w-5 h-5 mr-2" />
              Смотреть трейлер
            </Button>
          </div>
        </div>
      ))}

      <button
        onClick={handlePrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {movies.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? "bg-white" : "bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  )
}

