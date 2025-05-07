import { NextResponse } from "next/server"

const SIEVE_API_KEY = process.env.SIEVE_API_KEY
const SIEVE_API_URL = "https://mango.sievedata.com/v2"

// Cache to prevent duplicate job creation
export const jobCache = new Map<
  string,
  {
    downloadJobId: string
    status: "processing" | "finished" | "failed"
    createdAt: number
    lastChecked: number
    error?: string
    subtitles?: string // Store the formatted subtitles when job completes
  }
>()

// Track in-progress requests to prevent duplicate processing
const inProgressRequests = new Map<string, Promise<any>>()

// Helper to update job status
async function updateJobStatus(
  videoId: string,
  status: "processing" | "finished" | "failed",
  error?: string,
  subtitles?: string,
) {
  const jobInfo = jobCache.get(videoId)
  if (jobInfo) {
    jobInfo.status = status
    jobInfo.lastChecked = Date.now()
    if (error) jobInfo.error = error
    if (subtitles) jobInfo.subtitles = subtitles
    jobCache.set(videoId, jobInfo)
  }
}

// Helper to format timestamp to MM:SS or HH:MM:SS
function formatTimestamp(timestamp: string): string {
  // Convert "00:08:38.959" or "08:38.959" to proper format
  const parts = timestamp.split(':')
  if (parts.length === 3) {
    // HH:MM:SS format
    const [hours, minutes, secondsWithMs] = parts
    const seconds = Math.round(parseFloat(secondsWithMs))
    if (hours === "00") {
      // If hours is 00, return MM:SS
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
    return `${hours}:${minutes}:${seconds.toString().padStart(2, '0')}`
  } else {
    // MM:SS format
    const [minutes, secondsWithMs] = parts
    const seconds = Math.round(parseFloat(secondsWithMs))
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}

// Helper to parse WebVTT content into a readable format
async function parseVTTContent(url: string): Promise<string> {
  console.log("Fetching VTT content from URL:", url)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch VTT content: ${response.status} ${response.statusText}`)
  }
  
  const vttContent = await response.text()
  console.log("Raw VTT content first 500 chars:", vttContent.substring(0, 500))
  
  const lines = vttContent.split('\n')
  let formattedContent: string[] = []
  let currentTime = ''
  let currentText: string[] = []

  // Skip the WEBVTT header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (line.includes('-->')) {
      if (currentTime && currentText.length > 0) {
        // Extract and format the start timestamp
        const startTime = currentTime.split('-->')[0].trim()
        const formattedTime = formatTimestamp(startTime)
        formattedContent.push(`[${formattedTime}]\n${currentText.join(' ')}`)
      }
      currentTime = line
      currentText = []
    } else if (line === '') {
      continue
    } else if (line !== 'WEBVTT' && line) {
      currentText.push(line)
    }
  }
  
  // Don't forget to add the last segment
  if (currentTime && currentText.length > 0) {
    const startTime = currentTime.split('-->')[0].trim()
    const formattedTime = formatTimestamp(startTime)
    formattedContent.push(`[${formattedTime}]\n${currentText.join(' ')}`)
  }

  const formatted = formattedContent.join('\n\n')
  console.log("Formatted transcript first 500 chars:", formatted.substring(0, 500))
  return formatted
}

async function downloadSubtitles(videoId: string) {
  // Check if we already have a job for this video
  const cachedJob = jobCache.get(videoId)
  if (cachedJob) {
    // If the job is more than 1 hour old, remove it from cache
    if (Date.now() - cachedJob.createdAt > 3600000) {
      jobCache.delete(videoId)
      inProgressRequests.delete(videoId)
    } else {
      console.log("Using cached job for video:", videoId, cachedJob)
      return cachedJob
    }
  }

  // Check if there's already a request in progress
  const inProgress = inProgressRequests.get(videoId)
  if (inProgress) {
    console.log("Request already in progress for video:", videoId)
    return inProgress
  }

  console.log("Starting subtitle download for:", videoId)
  const response = await fetch(`${SIEVE_API_URL}/push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": SIEVE_API_KEY!,
    },
    body: JSON.stringify({
      function: "sieve/youtube-downloader",
      inputs: {
        url: `https://www.youtube.com/watch?v=${videoId}`,
        download_type: "subtitles",
        include_metadata: true,
        metadata_fields: ["title", "description", "duration"],
        include_subtitles: true,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Download error response:", errorText)
    try {
      const errorData = JSON.parse(errorText)
      throw new Error(`Failed to download subtitles: ${JSON.stringify(errorData)}`)
    } catch {
      throw new Error(`Failed to download subtitles: ${response.status} ${response.statusText}`)
    }
  }

  const data = await response.json().catch((error) => {
    console.error("Error parsing response:", error)
    throw new Error("Invalid response from Sieve API")
  })
  console.log("Download job created:", data)

  const jobInfo = {
    downloadJobId: data.id,
    status: "processing" as const,
    createdAt: Date.now(),
    lastChecked: Date.now(),
  }
  jobCache.set(videoId, jobInfo)
  return jobInfo
}

async function waitForJobCompletion(jobId: string, jobType: string) {
  console.log(`Waiting for ${jobType} job completion:`, jobId)
  const maxAttempts = 60
  let attempts = 0

  while (attempts < maxAttempts) {
    const response = await fetch(`${SIEVE_API_URL}/jobs/${jobId}`, {
      headers: { "X-API-Key": SIEVE_API_KEY! },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to check ${jobType} job status:`, errorText)
      throw new Error(`Failed to check ${jobType} job status: ${response.status} ${response.statusText}`)
    }

    const status = await response.json()
    console.log(`${jobType} job status:`, status.status)

    if (status.status === "finished") {
      console.log(`${jobType} job finished successfully`)
      console.log("Full outputs:", JSON.stringify(status.outputs, null, 2))
      
      // First check if we have any outputs
      if (!status.outputs || !Array.isArray(status.outputs) || status.outputs.length === 0) {
        console.error("No outputs found in finished job")
        throw new Error("No outputs found in finished job")
      }

      // Find the subtitles output - looking for data.en.url structure
      let vttUrl: string | undefined
      
      for (const output of status.outputs) {
        console.log("Checking output:", output)
        
        // Check for the nested en.url structure
        if (output.data?.en?.url) {
          vttUrl = output.data.en.url
          break
        }
      }

      if (!vttUrl) {
        console.error("No VTT URL found in outputs:", status.outputs)
        throw new Error("No subtitle URL found in finished job")
      }

      console.log("Found VTT URL:", vttUrl)
      try {
        const formattedText = await parseVTTContent(vttUrl)
        if (!formattedText) {
          throw new Error("No subtitle text found in VTT file")
        }
        
        // Store the formatted subtitles in the status object
        const result = { 
          ...status, 
          status: "finished", // Normalize status to "finished" for our frontend
          parsedSubtitles: formattedText 
        }

        // Update the job cache with the subtitles
        const fullUrl = status.inputs?.url?.data || status.inputs?.url
        const videoId = typeof fullUrl === 'string' ? 
          fullUrl.match(/[?&]v=([^&]+)/)?.[1] || // Extract from youtube.com/watch?v=ID
          fullUrl.match(/youtu\.be\/([^?]+)/)?.[1] || // Extract from youtu.be/ID
          fullUrl : null // Fallback to the original value if not a string

        if (videoId) {
          console.log("Updating job cache with subtitles for video:", videoId)
          await updateJobStatus(videoId, "finished", undefined, formattedText)
        } else {
          console.error("Could not extract videoId from job inputs:", JSON.stringify(status.inputs, null, 2))
        }

        return result
      } catch (error) {
        console.error("Error parsing VTT:", error)
        throw error
      }
      
    } else if (status.status === "error") {
      const errorDetails = status.error || "Unknown error"
      console.error(`${jobType} job failed. Full response:`, JSON.stringify(status, null, 2))
      throw new Error(`${jobType} job failed: ${errorDetails}`)
    } else if (status.status === "processing" || status.status === "queued") {
      // Log progress if available
      if (status.progress) {
        console.log(`${jobType} job progress:`, status.progress)
      }
    }

    attempts++
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  throw new Error(`${jobType} job timed out after ${maxAttempts} attempts`)
}

export async function POST(request: Request) {
  try {
    const { videoId } = await request.json()

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
    }

    if (!SIEVE_API_KEY) {
      return NextResponse.json({ error: "Sieve API key not configured" }, { status: 500 })
    }

    // Check cache first
    const cachedJob = jobCache.get(videoId)
    if (cachedJob && Date.now() - cachedJob.createdAt <= 3600000) {
      console.log("Found cached job for video:", videoId, cachedJob)

      // If job is finished and has subtitles, return it immediately
      if (cachedJob.status === "finished" && cachedJob.subtitles) {
        console.log("Returning finished cached job with subtitles")
        return NextResponse.json(cachedJob)
      }

      // If job is not completed or missing subtitles, check its current status
      try {
        console.log("Checking status of cached job:", cachedJob.downloadJobId)
        const jobStatus = await waitForJobCompletion(cachedJob.downloadJobId, "download")
        
        if (jobStatus.status === "running") {
          return NextResponse.json({ ...cachedJob, status: "processing" })
        }

        if (jobStatus.status === "finished" && jobStatus.parsedSubtitles) {
          await updateJobStatus(videoId, "finished", undefined, jobStatus.parsedSubtitles)
          return NextResponse.json({ 
            ...cachedJob, 
            status: "finished", 
            subtitles: jobStatus.parsedSubtitles 
          })
        }
        
        // If we get here, something went wrong with the job
        throw new Error("Job finished but no subtitles were found")
      } catch (error) {
        console.error("Error checking cached job status:", error)
        await updateJobStatus(videoId, "failed", error instanceof Error ? error.message : "Unknown error")
        // Remove the failed job from cache so we can try again
        jobCache.delete(videoId)
      }
    }

    // Check for in-progress request
    const inProgress = inProgressRequests.get(videoId)
    if (inProgress) {
      console.log("Returning in-progress request for video:", videoId)
      return NextResponse.json(await inProgress)
    }

    // Create a new request promise
    const requestPromise = (async () => {
      try {
        // Start subtitle download
        const jobInfo = await downloadSubtitles(videoId)
        
        // Wait for job completion and get subtitles
        const jobStatus = await waitForJobCompletion(jobInfo.downloadJobId, "download")
        
        if (jobStatus.status === "running") {
          return { ...jobInfo, status: "processing" }
        }

        if (jobStatus.status === "finished" && jobStatus.parsedSubtitles) {
          await updateJobStatus(videoId, "finished", undefined, jobStatus.parsedSubtitles)
          return { 
            ...jobInfo, 
            status: "finished", 
            subtitles: jobStatus.parsedSubtitles 
          }
        }

        throw new Error("Job finished but no subtitles were found")
      } catch (error) {
        console.error("Error processing video:", error)
        await updateJobStatus(videoId, "failed", error instanceof Error ? error.message : "Unknown error")
        throw error
      } finally {
        // Clean up the in-progress request
        inProgressRequests.delete(videoId)
      }
    })()

    // Store the promise
    inProgressRequests.set(videoId, requestPromise)

    // Wait for the result
    const result = await requestPromise
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error processing video:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process video" },
      { status: 500 },
    )
  }
}
