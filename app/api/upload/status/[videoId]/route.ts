import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import db from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ videoId: string }> }) {
  try {
    const user = await requireAuth()
    const { videoId } = await params

    const video = db.getVideoById(videoId)

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Check if user owns video or is admin
    if (video.userId !== user._id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const jobs = db.getJobsByVideoId(videoId)

    return NextResponse.json({
      video: {
        id: video._id,
        title: video.title,
        status: video.status,
        sensitivityStatus: video.sensitivityStatus,
        sensitivityScore: video.sensitivityScore,
      },
      jobs: jobs.map((job) => ({
        id: job._id,
        type: job.type,
        status: job.status,
        progress: job.progress,
        error: job.error,
      })),
    })
  } catch (error) {
    console.error("[v0] Status check error:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
