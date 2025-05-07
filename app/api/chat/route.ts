import { NextResponse } from "next/server"

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

export async function POST(req: Request) {
  try {
    console.log("Starting chat request processing...")
    const { messages, transcriptionJobId, videoMetadata } = await req.json()
    console.log("Received request with messages:", messages)

    // Get the transcript from your storage/database using the transcriptionJobId
    console.log("Fetching transcript for job:", transcriptionJobId)
    const transcriptResponse = await fetch(`${process.env.API_URL}/api/get-transcript`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcriptionJobId }),
    })

    if (!transcriptResponse.ok) {
      console.error("Failed to fetch transcript:", await transcriptResponse.text())
      throw new Error("Failed to fetch transcript")
    }

    const { transcript } = await transcriptResponse.json()
    console.log("Transcript fetched successfully")

    // Prepare the system message with context
    const systemMessage = {
      role: "system",
      content: `You are an AI that directly states what is in the video titled "${videoMetadata.title}". For general greetings like "hi", "hello", etc., respond naturally with a friendly greeting and offer to help answer questions about the video.

For questions about the video content, present the information as objective facts from the video, without referencing or attributing statements to any speaker. When answering content questions, cite specific timestamps in the exact format [HH:MM:SS] from the video transcript to support your responses.

Here's the video transcript:
${transcript}

For content responses, instead of saying "At [00:01:23], the speaker explains..." or "they mention...", simply state "At [00:01:23], the topic covers..." or "The video shows at [00:01:23]...". Always use the exact format [HH:MM:SS] with leading zeros for timestamps, which will be automatically converted into clickable links. If something is unclear from the video content, be honest about that. Keep your responses concise and focused on the video content.`,
    }

    // Prepare messages for the chat
    const chatMessages = [systemMessage, ...messages.filter((m: any) => m.role !== "system")]

    console.log("Prepared messages for Groq:", chatMessages)
    console.log("Using Groq API URL:", GROQ_API_URL)
    console.log("API Key present:", !!GROQ_API_KEY)

    // Call Groq API directly
    const completion = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: chatMessages,
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        stream: false,
      }),
    })

    console.log("Groq API response status:", completion.status)

    if (!completion.ok) {
      const errorText = await completion.text()
      console.error("Groq API error response:", errorText)
      try {
        const error = JSON.parse(errorText)
        throw new Error(error.message || "Failed to get response from Groq")
      } catch (e) {
        throw new Error(`Failed to get response from Groq: ${errorText}`)
      }
    }

    const data = await completion.json()
    console.log("Groq API response data:", data)

    const response = data.choices[0]?.message?.content || "I couldn't generate a response. Please try again."

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process chat request" },
      { status: 500 },
    )
  }
}
