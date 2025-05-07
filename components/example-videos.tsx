"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Play } from "lucide-react"

const exampleVideos = [
  {
    id: "8jPQjjsBbIc",
    title: "What is Next.js?",
    thumbnail: "https://img.youtube.com/vi/8jPQjjsBbIc/maxresdefault.jpg",
    duration: "11:32",
  },
  {
    id: "w7ejDZ8SWv8",
    title: "React JS Course for Beginners",
    thumbnail: "https://img.youtube.com/vi/w7ejDZ8SWv8/maxresdefault.jpg",
    duration: "8:30:00",
  },
  {
    id: "bMknfKXIFA8",
    title: "CSS Tutorial - Zero to Hero",
    thumbnail: "https://img.youtube.com/vi/bMknfKXIFA8/maxresdefault.jpg",
    duration: "6:18:37",
  },
]

export default function ExampleVideos() {
  const router = useRouter()

  const handleVideoSelect = (videoId: string) => {
    router.push(`/chat/${videoId}`)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {exampleVideos.map((video) => (
        <Card key={video.id} className="overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="relative">
            <img
              src={video.thumbnail || "/placeholder.svg"}
              alt={video.title}
              className="w-full aspect-video object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
              <Button variant="secondary" size="sm" className="gap-2" onClick={() => handleVideoSelect(video.id)}>
                <Play className="h-4 w-4" />
                Chat with this video
              </Button>
            </div>
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
              {video.duration}
            </div>
          </div>
          <CardContent className="p-4">
            <h3 className="font-medium line-clamp-2">{video.title}</h3>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
