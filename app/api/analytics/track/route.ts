import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { videoId, event, metadata } = await request.json()

    if (!videoId || !event) {
      return NextResponse.json({ error: "Video ID and event are required" }, { status: 400 })
    }

    // Validate event type
    const validEvents = ["view", "play", "pause", "complete", "buffer"]
    if (!validEvents.includes(event)) {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 })
    }

    const video = db.getVideoById(videoId)
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Create analytics event
    db.createAnalyticsEvent({
      videoId,
      event,
      metadata,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Analytics tracking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
