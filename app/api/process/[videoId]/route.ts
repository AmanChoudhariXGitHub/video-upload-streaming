import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import db from "@/lib/db"
import { processVideo } from "@/lib/video-processor"

export async function POST(request: NextRequest, { params }: { params: Promise<{ videoId: string }> }) {
  try {
    const user = await requireAuth()
    const { videoId } = await params

    const video = db.getVideoById(videoId)

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Check ownership or admin
    if (video.userId !== user._id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Start processing asynchronously
    processVideo(videoId).catch((error) => {
      console.error("[v0] Processing error:", error)
    })

    return NextResponse.json({
      success: true,
      message: "Processing started",
    })
  } catch (error) {
    console.error("[v0] Process initiation error:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
