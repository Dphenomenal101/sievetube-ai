import { NextResponse } from "next/server"
import { jobCache } from "../process-video/route"

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
const SIEVE_API_KEY = process.env.SIEVE_API_KEY

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
        formattedContent.push(`${currentTime}\n${currentText.join(' ')}`)
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
    formattedContent.push(`${currentTime}\n${currentText.join(' ')}`)
  }

  const formatted = formattedContent.join('\n\n')
  console.log("Formatted transcript first 500 chars:", formatted.substring(0, 500))
  return formatted
}

const getJobInfo = async (videoId: string) => {
  return jobCache.get(videoId)
}

const getCache = async () => {
  return Object.fromEntries(jobCache.entries())
}

export async function POST(request: Request) {
  try {
    console.log("Starting chat request processing...")
    const { messages, videoId, videoMetadata, cachedSubtitles } = await request.json()
    console.log("Received request for videoId:", videoId)

    if (!GROQ_API_KEY) {
      throw new Error("Groq API key not configured")
    }

    let transcript: string
    
    if (cachedSubtitles) {
      console.log("Using cached subtitles from client")
      transcript = cachedSubtitles
    } else {
      if (!SIEVE_API_KEY) {
        throw new Error("Sieve API key not configured")
      }

      // Get the cached job info
      const jobInfo = await getJobInfo(videoId)
      if (!jobInfo || jobInfo.status !== "finished") {
        console.error("No finished job info found in cache for videoId:", videoId)
        console.error("Current cache state:", await getCache())
        return NextResponse.json({ error: "Video processing not complete. Please try again later." }, { status: 404 })
      }
      console.log("Found job info:", { downloadJobId: jobInfo.downloadJobId, status: jobInfo.status, hasSubtitles: !!jobInfo.subtitles })

      // Get the subtitle URL from the raw job status
      console.log("Fetching job status from Sieve...")
      const jobStatus = await fetch(`https://mango.sievedata.com/v2/jobs/${jobInfo.downloadJobId}`, {
        headers: { "X-API-Key": SIEVE_API_KEY },
      })

      if (!jobStatus.ok) {
        const errorText = await jobStatus.text()
        console.error("Failed to fetch job status:", errorText)
        throw new Error(`Failed to fetch job status: ${jobStatus.status} ${jobStatus.statusText}`)
      }

      const jobData = await jobStatus.json()
      console.log("Job status response:", JSON.stringify(jobData, null, 2))

      const subtitleData = jobData.outputs?.find(
        (output: any) => output.type === "dict" && output.data?.en?.url
      )
      const subtitleUrl = subtitleData?.data?.en?.url

      if (!subtitleUrl) {
        console.error("No subtitle URL found in job data:", jobData)
        throw new Error("Subtitle URL not found in job data")
      }

      // Fetch and parse the VTT content
      console.log("Parsing VTT content...")
      transcript = await parseVTTContent(subtitleUrl)
    }

    // Prepare the system message with context
    const systemMessage = {
      role: "system",
      content: `You are an AI that directly states what is in the video titled "${videoMetadata.title}". For general greetings like "hi", "hello", etc., respond naturally with a friendly greeting and offer to help answer questions about the video.

For questions about the video content, present the information as objective facts from the video, without referencing or attributing statements to any speaker. When answering content questions, cite specific timestamps from the video transcript to support your responses.

Here's the video transcript:
${transcript}

For content responses:
1. For timestamps under 1 hour: Use [MM:SS] format with leading zeros (e.g. [01:23] for 1 minute 23 seconds)
2. For timestamps over 1 hour: Use [HH:MM:SS] format with leading zeros (e.g. [01:27:23] for 1 hour 27 minutes 23 seconds)

Instead of saying "the speaker explains..." or "they mention...", simply state "At [01:23], the topic covers..." or "The video shows at [01:27:23]...". These timestamps will be automatically converted into clickable links. If something is unclear from the video content, be honest about that. Keep your responses concise and focused on the video content.`,
    }

    console.log("Making request to Groq...")
    // Make request to Groq
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Groq API error:", error)
      throw new Error(`Failed to get response from Groq: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("Groq response received successfully")
    return NextResponse.json({ response: data.choices[0].message.content })
  } catch (error) {
    console.error("Error in chat:", error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to process chat",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 },
    )
  }
}
