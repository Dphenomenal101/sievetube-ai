import { NextResponse } from "next/server"

const SIEVE_API_KEY = process.env.SIEVE_API_KEY
const SIEVE_API_URL = "https://mango.sievedata.com/v2"

// Cache to prevent duplicate job creation
export const jobCache = new Map<
  string,
  {
    downloadJobId: string
    transcriptionJobId: string
    status: "downloading" | "transcribing" | "completed" | "failed"
    createdAt: number
    lastChecked: number
    error?: string
  }
>()

// Track in-progress requests to prevent duplicate processing
const inProgressRequests = new Map<string, Promise<any>>()

// Helper to update job status
async function updateJobStatus(
  videoId: string,
  status: "downloading" | "transcribing" | "completed" | "failed",
  error?: string,
) {
  const jobInfo = jobCache.get(videoId)
  if (jobInfo) {
    jobInfo.status = status
    jobInfo.lastChecked = Date.now()
    if (error) jobInfo.error = error
    jobCache.set(videoId, jobInfo)
  }
}

async function downloadVideo(videoId: string) {
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

  console.log("Starting video download for:", videoId)
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
        download_type: "audio", // We only need audio for transcription
        resolution: "lowest-available", // Resolution doesn't matter for audio
        include_audio: true,
        start_time: 0,
        end_time: -1,
        include_metadata: true,
        metadata_fields: ["title", "description", "duration"], // Only get what we need
        include_subtitles: false,
        audio_format: "mp3",
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Download error response:", errorText)
    try {
      const errorData = JSON.parse(errorText)
      throw new Error(`Failed to download video: ${JSON.stringify(errorData)}`)
    } catch {
      throw new Error(`Failed to download video: ${response.status} ${response.statusText}`)
    }
  }

  const data = await response.json().catch((error) => {
    console.error("Error parsing response:", error)
    throw new Error("Invalid response from Sieve API")
  })
  console.log("Download job created:", data)

  const jobInfo = {
    downloadJobId: data.id,
    transcriptionJobId: "",
    status: "downloading" as const,
    createdAt: Date.now(),
    lastChecked: Date.now(),
  }
  jobCache.set(videoId, jobInfo)
  return jobInfo
}

async function waitForJobCompletion(jobId: string, jobType: string) {
  console.log(`Waiting for ${jobType} job completion:`, jobId)
  let attempts = 0
  const maxAttempts = 150 // 5 minutes maximum wait time
  let lastStatus = ""

  while (attempts < maxAttempts) {
    const response = await fetch(`${SIEVE_API_URL}/jobs/${jobId}`, {
      headers: { "X-API-Key": SIEVE_API_KEY! },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to check ${jobType} job status:`, errorText)
      throw new Error(`Failed to check ${jobType} job status: ${response.status} ${errorText}`)
    }

    const status = await response.json()

    // Only log if status has changed
    if (status.status !== lastStatus) {
      console.log(`${jobType} job status changed to:`, status.status)
      console.log("Full status:", JSON.stringify(status, null, 2))
      lastStatus = status.status
    }

    // For download jobs, check if we have the URL even if not "completed"
    if (jobType === "download" && status.outputs?.[1]?.data?.url) {
      console.log("Got download URL before completion:", status.outputs[1].data.url)
      return status
    }

    if (status.status === "completed") {
      console.log(`${jobType} job completed successfully. Full response:`, JSON.stringify(status, null, 2))
      return status
    } else if (status.status === "failed") {
      const errorDetails = status.error || "Unknown error"
      console.error(`${jobType} job failed. Full response:`, JSON.stringify(status, null, 2))
      throw new Error(`${jobType} job failed: ${errorDetails}`)
    } else if (status.status === "running") {
      // Log progress if available
      if (status.progress) {
        console.log(`${jobType} job progress:`, status.progress)
      }
    }

    attempts++
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  throw new Error(`${jobType} job timed out after ${maxAttempts * 2} seconds`)
}

async function transcribeAudio(downloadJobId: string) {
  // First, wait for the download job to complete and get its status
  console.log("Waiting for download job to complete before starting transcription:", downloadJobId)
  const downloadStatus = await waitForJobCompletion(downloadJobId, "download")

  // Find the audio file URL from the outputs array in the completed job status
  const audioOutput = downloadStatus.outputs?.find((output: any) => output.type === "sieve.File")
  const audioUrl = audioOutput?.data?.url

  if (!audioUrl) {
    console.error("No audio URL found in completed download job:", JSON.stringify(downloadStatus.outputs, null, 2))
    throw new Error("No audio URL found in completed download job")
  }

  console.log("Using audio URL for transcription:", audioUrl)

  // Start transcription
  console.log(
    "Making transcription request with payload:",
    JSON.stringify(
      {
        function: "sieve/transcribe",
        inputs: {
          file: { url: audioUrl },
          backend: "stable-ts-whisper-large-v3-turbo",
          word_level_timestamps: true,
          source_language: "auto",
          diarization_backend: "None",
          min_speakers: -1,
          max_speakers: -1,
          custom_vocabulary: {},
          translation_backend: "None",
          target_language: "",
          segmentation_backend: "ffmpeg-silence",
          min_segment_length: -1,
          min_silence_length: 0.4,
          vad_threshold: 0.2,
          pyannote_segmentation_threshold: 0.8,
          chunks: [],
          denoise_backend: "None",
          initial_prompt: "",
        },
      },
      null,
      2,
    ),
  )

  const response = await fetch(`${SIEVE_API_URL}/push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": SIEVE_API_KEY!,
    },
    body: JSON.stringify({
      function: "sieve/transcribe",
      inputs: {
        file: { url: audioUrl },
        backend: "groq-whisper-large-v3", // Fastest model
        word_level_timestamps: false, // Don't need word timestamps for chat
        source_language: "auto",
        diarization_backend: "None",
        segmentation_backend: "none", // No need to segment for parallel processing
        denoise_backend: "None",
      },
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error("Transcription error. Response:", response.status, response.statusText)
    console.error("Error data:", errorData)
    throw new Error(`Failed to start transcription: ${JSON.stringify(errorData)}`)
  }

  const data = await response.json()
  console.log("Transcription job created successfully:", JSON.stringify(data, null, 2))
  return data
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

      // If job is not completed, check its current status
      if (cachedJob.status !== "completed") {
        try {
          // If we have a transcription job ID, check its status
          if (cachedJob.transcriptionJobId) {
            console.log("Checking status of cached transcription job:", cachedJob.transcriptionJobId)
            await waitForJobCompletion(cachedJob.transcriptionJobId, "transcription")
            await updateJobStatus(videoId, "completed")
          }
          // If we only have a download job ID, continue the process
          else if (cachedJob.downloadJobId) {
            console.log("Continuing process for cached download job:", cachedJob.downloadJobId)
            const transcriptionJob = await transcribeAudio(cachedJob.downloadJobId)
            cachedJob.transcriptionJobId = transcriptionJob.id
            await updateJobStatus(videoId, "transcribing")
          }
          return NextResponse.json(cachedJob)
        } catch (error) {
          console.error("Error checking cached job status:", error)
          // If the cached job failed, remove it and start fresh
          jobCache.delete(videoId)
        }
      } else {
        return NextResponse.json(cachedJob)
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
        // Start video download
        const jobInfo = await downloadVideo(videoId)

        // Start transcription using the download job ID
        const transcriptionJob = await transcribeAudio(jobInfo.downloadJobId)
        jobInfo.transcriptionJobId = transcriptionJob.id
        await updateJobStatus(videoId, "transcribing")

        return jobInfo
      } catch (error) {
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
