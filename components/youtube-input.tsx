"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { extractVideoId } from "@/lib/youtube-utils"
import { AlertCircle, Loader2, SendHorizontal, Youtube } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function YouTubeInput() {
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const videoId = extractVideoId(url)

    if (!videoId) {
      setError("Please enter a valid YouTube URL")
      setIsSubmitting(false)
      return
    }

    setError("")
    router.push(`/chat/${videoId}`)
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              <Youtube className="h-5 w-5" />
            </div>
            <Input
              type="text"
              placeholder="Paste YouTube URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-10 pr-4 py-6 text-base"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 transition-all duration-300"
            disabled={isSubmitting || !url.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Start Chat
                <SendHorizontal className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="animate-fadeIn">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  )
}
