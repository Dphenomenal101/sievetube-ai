"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import Image from "next/image"

interface VideoPlayerProps {
  videoId: string
}

export default function VideoPlayer({ videoId }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [thumbnailError, setThumbnailError] = useState(false)
  const [player, setPlayer] = useState<any>(null)

  useEffect(() => {
    // Only load the API if it hasn't been loaded yet
    if (!(window as any).YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }

    // Function to create the player
    const createPlayer = () => {
      if (!playerRef.current) return

      try {
        const newPlayer = new (window as any).YT.Player(playerRef.current, {
          videoId,
          playerVars: {
            autoplay: 0,
            modestbranding: 1,
            rel: 0,
          },
          height: "100%",
          width: "100%",
          events: {
            onReady: () => {
              setIsLoading(false)
              setPlayer(newPlayer)
            },
          },
        })
      } catch (error) {
        console.error("Error creating YouTube player:", error)
      }
    }

    // If YT API is already loaded, create player immediately
    if ((window as any).YT && (window as any).YT.Player) {
      createPlayer()
    } else {
      // If not, wait for API to load
      window.onYouTubeIframeAPIReady = () => {
        createPlayer()
      }
    }

    return () => {
      window.onYouTubeIframeAPIReady = () => {}
    }
  }, [videoId])

  // Add seekToTime function to window object
  useEffect(() => {
    (window as any).seekToTime = (seconds: number) => {
      if (player && typeof player.seekTo === 'function') {
        player.seekTo(seconds, true)
        // Scroll to player smoothly
        containerRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        })
      }
    }

    return () => {
      delete (window as any).seekToTime
    }
  }, [player])

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-xl border border-slate-100">
      <div className="aspect-video w-full relative">
        {/* Show thumbnail while loading */}
        {isLoading && !thumbnailError && (
          <Image
            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
            alt="Video thumbnail"
            fill
            className="object-cover"
            onError={() => setThumbnailError(true)}
            priority
          />
        )}
        <div ref={playerRef} className="absolute inset-0" />
        {isLoading && (
          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading player...
          </div>
        )}
      </div>
    </div>
  )
}
