"use client"

import { useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Movie } from "@/lib/tmdb"
import { getImageUrl, getYear } from "@/lib/tmdb"

interface PopularSectionProps {
  title: string
  items: Movie[]
}

export default function PopularSection({ title, items }: PopularSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return

    const scrollAmount = direction === "left" ? -400 : 400
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4">
        {items.map((item) => (
          <div key={item.id} className="flex-none w-[200px] transition-transform hover:scale-105">
            <div className="relative aspect-[2/3] rounded-md overflow-hidden mb-2">
              <Image
                src={getImageUrl(item.poster_path) || "/placeholder.svg"}
                alt={item.title || item.name || ""}
                fill
                className="object-cover"
              />
            </div>
            <h3 className="font-medium truncate">{item.title || item.name}</h3>
            <p className="text-sm text-gray-400">{getYear(item.release_date || item.first_air_date)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

