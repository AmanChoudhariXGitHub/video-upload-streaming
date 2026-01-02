import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import cdn from "@/lib/cdn-simulator"
import { readFile } from "fs/promises"
import { existsSync } from "fs"

export async function GET(request: NextRequest, { params }: { params: Promise<{ videoId: string }> }) {
  try {
    const { videoId } = await params
    const video = db.getVideoById(videoId)

    if (!video || !video.thumbnailPath) {
      return NextResponse.json({ error: "Thumbnail not found" }, { status: 404 })
    }

    // Check CDN cache
    const cached = await cdn.get(video.thumbnailPath)

    if (cached) {
      return new NextResponse(cached.data, {
        headers: {
          "Content-Type": cached.contentType,
          "Cache-Control": "public, max-age=86400",
          "X-Cache": "HIT",
        },
      })
    }

    // Read from storage
    if (existsSync(video.thumbnailPath)) {
      const data = await readFile(video.thumbnailPath)

      // Cache it
      await cdn.cache(video.thumbnailPath, data, "image/jpeg")

      return new NextResponse(data, {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=86400",
          "X-Cache": "MISS",
        },
      })
    }

    // Return placeholder if file doesn't exist
    return NextResponse.redirect(`/placeholder.svg?height=200&width=350&query=video+thumbnail`)
  } catch (error) {
    console.error("[v0] Thumbnail error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
