export interface VideoInfo {
  title: string
  channelTitle: string
  duration: number
  description: string
  publishedAt: string
  viewCount: string
  likeCount: string
  thumbnailUrl: string
}

export async function getVideoInfo(videoId: string): Promise<VideoInfo> {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key is not configured')
  }

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch video info from YouTube')
  }

  const data = await response.json()
  
  if (!data.items?.[0]) {
    throw new Error('Video not found')
  }

  const video = data.items[0]
  const { snippet, contentDetails, statistics } = video

  // Convert ISO 8601 duration to seconds
  const durationMatch = contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  const hours = parseInt(durationMatch?.[1] || '0')
  const minutes = parseInt(durationMatch?.[2] || '0')
  const seconds = parseInt(durationMatch?.[3] || '0')
  const durationInSeconds = (hours * 3600) + (minutes * 60) + seconds

  return {
    title: snippet.title,
    channelTitle: snippet.channelTitle,
    duration: durationInSeconds,
    description: snippet.description,
    publishedAt: snippet.publishedAt,
    viewCount: statistics.viewCount,
    likeCount: statistics.likeCount,
    thumbnailUrl: snippet.thumbnails.maxresdefault?.url || snippet.thumbnails.high.url,
  }
}

export async function getVideoTranscript(videoId: string): Promise<string> {
  // In a real application, you would fetch the transcript from the YouTube API
  // For this demo, we'll return mock data
  return "This is a mock transcript for the video. In a real application, you would fetch the actual transcript from the YouTube API and process it for use with the AI model."
}
