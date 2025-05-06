import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import VideoPlayer from "@/components/video-player"
import ChatInterface from "@/components/chat-interface"
import VideoMetadata from "@/components/video-metadata"
import { getVideoInfo } from "@/lib/youtube-api"
import { Plus, Home } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ChatPage({ params }: { params: { videoId: string } }) {
  const { videoId } = params
  const videoInfo = await getVideoInfo(videoId)

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <Home className="h-4 w-4" />
              SieveTube Chat
            </Link>

            <Link href="/">
              <Button variant="outline" size="sm" className="gap-1">
                <Plus className="h-3 w-3" />
                New Video
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 flex flex-col gap-4">
            <Suspense fallback={<VideoPlayerSkeleton />}>
              <VideoPlayer videoId={videoId} />
            </Suspense>

            <Suspense fallback={<Skeleton className="h-24 w-full rounded-xl" />}>
              <VideoMetadata videoInfo={videoInfo} />
            </Suspense>
          </div>

          <div className="lg:col-span-2">
            <Suspense fallback={<ChatInterfaceSkeleton />}>
              <ChatInterface videoId={videoId} videoInfo={videoInfo} />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  )
}

function VideoPlayerSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-white shadow-sm border border-slate-100">
      <Skeleton className="aspect-video w-full" />
    </div>
  )
}

function ChatInterfaceSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-white shadow-sm border border-slate-100 h-[600px]">
      <Skeleton className="h-12 w-full" />
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-3/4 mx-auto" />
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="h-16 w-2/3 ml-auto" />
        <Skeleton className="h-16 w-2/3" />
      </div>
      <Skeleton className="h-14 w-full mt-auto" />
    </div>
  )
}
