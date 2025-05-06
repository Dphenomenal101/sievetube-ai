import { Card, CardContent } from "@/components/ui/card"
import { formatDuration } from "@/lib/youtube-utils"
import type { VideoInfo } from "@/lib/youtube-api"
import { Clock, User, Calendar, Eye } from "lucide-react"

interface VideoMetadataProps {
  videoInfo: VideoInfo
}

export default function VideoMetadata({ videoInfo }: VideoMetadataProps) {
  return (
    <Card className="shadow-sm border border-slate-100">
      <CardContent className="p-5">
        <h2 className="text-xl font-semibold mb-3">{videoInfo.title}</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <User className="h-4 w-4 text-slate-400" />
            <span>{videoInfo.channelTitle || "Unknown Channel"}</span>
          </div>

          {videoInfo.duration && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>{formatDuration(videoInfo.duration)}</span>
            </div>
          )}

          {videoInfo.publishedAt && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>{new Date(videoInfo.publishedAt).toLocaleDateString()}</span>
            </div>
          )}

          {videoInfo.viewCount && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Eye className="h-4 w-4 text-slate-400" />
              <span>{Number.parseInt(videoInfo.viewCount).toLocaleString()} views</span>
            </div>
          )}
        </div>

        {videoInfo.description && (
          <div className="mt-3 text-sm text-slate-600 line-clamp-3">{videoInfo.description}</div>
        )}
      </CardContent>
    </Card>
  )
}
