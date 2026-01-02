import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import db from "@/lib/db"
import { deleteFile } from "@/lib/file-storage"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ videoId: string }> }) {
  try {
    await requireAdmin()
    const { videoId } = await params
    const updates = await request.json()

    const video = db.getVideoById(videoId)

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Update video
    const updatedVideo = db.updateVideo(videoId, updates)

    return NextResponse.json({
      success: true,
      video: updatedVideo,
    })
  } catch (error) {
    console.error("[v0] Admin update video error:", error)

    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ videoId: string }> }) {
  try {
    await requireAdmin()
    const { videoId } = await params

    const video = db.getVideoById(videoId)

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Delete files
    if (video.originalPath) await deleteFile(video.originalPath)
    if (video.processedPath) await deleteFile(video.processedPath)
    if (video.thumbnailPath) await deleteFile(video.thumbnailPath)

    // Delete from database
    db.deleteVideo(videoId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Admin delete video error:", error)

    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
