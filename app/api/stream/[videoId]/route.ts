import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import cdn from "@/lib/cdn-simulator"
import { readFile } from "fs/promises"
import { existsSync } from "fs"

export async function GET(request: NextRequest, { params }: { params: Promise<{ videoId: string }> }) {
  try {
    const { videoId } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "hls" // hls or dash

    const video = db.getVideoById(videoId)

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    if (video.status !== "ready") {
      return NextResponse.json({ error: "Video not ready for streaming" }, { status: 400 })
    }

    // Check if video is flagged
    if (video.sensitivityStatus === "flagged") {
      return NextResponse.json(
        {
          error: "Video contains sensitive content and requires admin approval",
          sensitivityScore: video.sensitivityScore,
        },
        { status: 403 },
      )
    }

    const streamPath = format === "dash" ? video.dashPath : video.hlsPath

    if (!streamPath) {
      return NextResponse.json({ error: "Stream not available" }, { status: 404 })
    }

    // Check CDN cache first
    const cached = await cdn.get(streamPath)

    if (cached) {
      return new NextResponse(cached.data, {
        headers: {
          "Content-Type": cached.contentType,
          "Cache-Control": "public, max-age=3600",
          "X-Cache": "HIT",
        },
      })
    }

    // Read from storage
    if (existsSync(streamPath)) {
      const data = await readFile(streamPath)
      const contentType = format === "dash" ? "application/dash+xml" : "application/vnd.apple.mpegurl"

      // Cache it
      await cdn.cache(streamPath, data, contentType)

      // Track analytics
      db.createAnalyticsEvent({
        videoId,
        event: "view",
        metadata: { format, userAgent: request.headers.get("user-agent") },
      })

      // Increment view count
      db.updateVideo(videoId, { views: video.views + 1 })

      return new NextResponse(data, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
          "X-Cache": "MISS",
        },
      })
    }

    return NextResponse.json({ error: "Stream file not found" }, { status: 404 })
  } catch (error) {
    console.error("[v0] Stream error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
