import { NextResponse } from "next/server"
import { jobCache } from "../process-video/route"

export interface SieveJobEvent {
  id: string
  status: string
  outputs?: Array<{
    data?: {
      url?: string
      text?: string
    }
  }>
  error?: string
}

export async function POST(request: Request) {
  try {
    const event: SieveJobEvent = await request.json()

    // Find the video ID associated with this job
    let affectedVideoId: string | undefined
    for (const [videoId, jobInfo] of jobCache.entries()) {
      if (jobInfo.downloadJobId === event.id) {
        affectedVideoId = videoId
        break
      }
    }

    if (!affectedVideoId) {
      console.warn("Received job event for unknown job:", event)
      return NextResponse.json({ status: "ignored" })
    }

    const jobInfo = jobCache.get(affectedVideoId)
    if (!jobInfo) {
      return NextResponse.json({ error: "Job info not found" }, { status: 404 })
    }

    // Update job status based on event
    if (event.error) {
      jobInfo.status = "failed"
      jobInfo.error = event.error
    } else if (event.status === "completed") {
      jobInfo.status = "completed"
    }

    jobInfo.lastChecked = Date.now()
    jobCache.set(affectedVideoId, jobInfo)

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("Error processing job event:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process job event" },
      { status: 500 },
    )
  }
}
