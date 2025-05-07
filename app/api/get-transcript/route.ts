import { NextResponse } from "next/server"

const SIEVE_API_KEY = process.env.SIEVE_API_KEY
const SIEVE_API_URL = "https://mango.sievedata.com/v2"

// Cache transcripts in memory
const transcriptCache = new Map<string, string>()

async function getTranscript(jobId: string) {
  try {
    // Check cache first
    const cached = transcriptCache.get(jobId)
    if (cached) {
      return cached
    }

    // Get job status
    const response = await fetch(`${SIEVE_API_URL}/jobs/${jobId}`, {
      headers: { "X-API-Key": SIEVE_API_KEY! },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch job status")
    }

    const status = await response.json()

    if (status.status === "failed") {
      throw new Error("Transcription failed")
    }

    if (status.status !== "completed" && status.status !== "finished") {
      throw new Error("Transcription not completed")
    }

    // Extract and format transcript
    const outputs = status.outputs || []
    let transcriptText = ""

    for (const output of outputs) {
      if (output.type === "dict" && output.data?.segments) {
        const segments = output.data.segments
        transcriptText += segments
          .map((segment: any) => {
            const startTime = new Date(segment.start * 1000).toISOString().substr(11, 8)
            return `[${startTime}] ${segment.text}`
          })
          .join("\n")
      }
    }

    if (!transcriptText) {
      throw new Error("No transcript segments found")
    }

    // Cache the transcript
    transcriptCache.set(jobId, transcriptText)
    return transcriptText
  } catch (error) {
    console.error("Error getting transcript:", error)
    throw error
  }
}

export async function POST(req: Request) {
  try {
    const { transcriptionJobId } = await req.json()

    if (!transcriptionJobId) {
      return NextResponse.json({ error: "Transcription job ID is required" }, { status: 400 })
    }

    const transcript = await getTranscript(transcriptionJobId)
    return NextResponse.json({ transcript })
  } catch (error) {
    console.error("Error in get-transcript:", error)
    return NextResponse.json({ error: "Failed to get transcript" }, { status: 500 })
  }
}
