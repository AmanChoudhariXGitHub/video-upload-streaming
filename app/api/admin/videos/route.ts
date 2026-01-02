import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import db from "@/lib/db"

export async function GET() {
  try {
    await requireAdmin()

    const videos = db.getAllVideos()

    const videoList = videos.map((video) => ({
      id: video._id,
      userId: video.userId,
      title: video.title,
      description: video.description,
      filename: video.filename,
      status: video.status,
      sensitivityStatus: video.sensitivityStatus,
      sensitivityScore: video.sensitivityScore,
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
    console.error("[v0] Admin get videos error:", error)

    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
