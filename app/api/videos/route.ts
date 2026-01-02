import { NextResponse } from "next/server"
import db from "@/lib/db"

export async function GET() {
  try {
    const videos = db.getAllVideos().filter((v) => v.status === "ready" && v.sensitivityStatus === "safe")

    const videoList = videos.map((video) => ({
      id: video._id,
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnailPath ? `/api/thumbnail/${video._id}` : null,
      duration: video.duration,
      resolution: video.resolution,
      views: video.views,
      createdAt: video.createdAt,
    }))

    return NextResponse.json({ videos: videoList })
  } catch (error) {
    console.error("[v0] Get videos error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
