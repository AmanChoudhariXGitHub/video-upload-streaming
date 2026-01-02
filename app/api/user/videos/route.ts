import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import db from "@/lib/db"

export async function GET() {
  try {
    const user = await requireAuth()
    const videos = db.getVideosByUserId(user._id)

    const videoList = videos.map((video) => ({
      id: video._id,
      title: video.title,
      description: video.description,
      filename: video.filename,
      status: video.status,
      sensitivityStatus: video.sensitivityStatus,
      sensitivityScore: video.sensitivityScore,
      thumbnail: video.thumbnailPath ? `/api/thumbnail/${video._id}` : null,
      size: video.size,
      format: video.format,
      duration: video.duration,
      resolution: video.resolution,
      views: video.views,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
    }))

    return NextResponse.json({ videos: videoList })
  } catch (error) {
    console.error("[v0] Get user videos error:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
