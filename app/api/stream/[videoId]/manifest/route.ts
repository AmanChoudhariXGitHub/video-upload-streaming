import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ videoId: string }> }) {
  try {
    const { videoId } = await params
    const video = db.getVideoById(videoId)

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    if (video.status !== "ready") {
      return NextResponse.json({ error: "Video not ready" }, { status: 400 })
    }

    // Return manifest with available formats
    const manifest = {
      id: video._id,
      title: video.title,
      description: video.description,
      duration: video.duration,
      resolution: video.resolution,
      thumbnail: video.thumbnailPath ? `/api/thumbnail/${video._id}` : null,
      formats: {
        hls: video.hlsPath ? `/api/stream/${video._id}?format=hls` : null,
        dash: video.dashPath ? `/api/stream/${video._id}?format=dash` : null,
      },
      sensitivityStatus: video.sensitivityStatus,
      views: video.views,
    }

    return NextResponse.json(manifest)
  } catch (error) {
    console.error("[v0] Manifest error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
