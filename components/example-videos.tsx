"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Play } from "lucide-react"

const exampleVideos = [
  {
    id: "Pg72m3CjuK4",
    title: "How to START a STARTUP with Michael Seibel",
    thumbnail: "https://img.youtube.com/vi/Pg72m3CjuK4/maxresdefault.jpg",
    duration: "15:42",
  },
  {
    id: "Sklc_fQBmcs",
    title: "Next.js in 100 Seconds // Plus Full Beginner's Tutorial",
    thumbnail: "https://img.youtube.com/vi/Sklc_fQBmcs/maxresdefault.jpg",
    duration: "11:32",
  },
  {
    id: "BJjsfNO5JTo",
    title: "How To Get The Most Out Of Vibe Coding | Startup School",
    thumbnail: "https://img.youtube.com/vi/BJjsfNO5JTo/maxresdefault.jpg",
    duration: "12:15",
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
