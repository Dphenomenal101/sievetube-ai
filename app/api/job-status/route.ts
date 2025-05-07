import { NextResponse } from "next/server"

const SIEVE_API_KEY = process.env.SIEVE_API_KEY
const SIEVE_API_URL = "https://mango.sievedata.com/v2"

export async function POST(request: Request) {
  try {
    const { jobId } = await request.json()

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    if (!SIEVE_API_KEY) {
      return NextResponse.json({ error: "Sieve API key not configured" }, { status: 500 })
    }

    // Get job status from Sieve
    const response = await fetch(`${SIEVE_API_URL}/jobs/${jobId}`, {
      headers: { "X-API-Key": SIEVE_API_KEY },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error response from Sieve:", errorText)
      return NextResponse.json(
        { error: `Failed to check job status: ${response.status} ${response.statusText}` },
        { status: response.status },
      )
    }

    const status = await response.json()
    return NextResponse.json(status)
  } catch (error) {
    console.error("Error checking job status:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check job status" },
      { status: 500 },
    )
  }
}
