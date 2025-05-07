import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import VideoPlayer from "@/components/video-player"
import ChatInterface from "@/components/chat-interface"
import VideoMetadata from "@/components/video-metadata"
import { getVideoInfo } from "@/lib/youtube-api"
import ChatHeader from "@/components/chat-header"

export default async function ChatPage({ params }: { params: { videoId: string } }) {
  // Ensure params is properly awaited
  const { videoId } = params
  const videoInfo = await getVideoInfo(videoId)

  return (
    <main className="min-h-screen bg-slate-50">
      <ChatHeader />

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
