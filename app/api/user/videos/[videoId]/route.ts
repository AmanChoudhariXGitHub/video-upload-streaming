import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import db from "@/lib/db"
import { deleteFile } from "@/lib/file-storage"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ videoId: string }> }) {
  try {
    const user = await requireAuth()
    const { videoId } = await params
    const updates = await request.json()

    const video = db.getVideoById(videoId)

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    if (video.userId !== user._id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Only allow updating title and description
    const allowedUpdates: any = {}
    if (updates.title) allowedUpdates.title = updates.title
    if (updates.description !== undefined) allowedUpdates.description = updates.description

    const updatedVideo = db.updateVideo(videoId, allowedUpdates)

    return NextResponse.json({
      success: true,
      video: updatedVideo,
    })
  } catch (error) {
    console.error("[v0] Update video error:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ videoId: string }> }) {
  try {
    const user = await requireAuth()
    const { videoId } = await params

    const video = db.getVideoById(videoId)

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    if (video.userId !== user._id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete files
    if (video.originalPath) await deleteFile(video.originalPath)
    if (video.processedPath) await deleteFile(video.processedPath)
    if (video.thumbnailPath) await deleteFile(video.thumbnailPath)

    // Delete from database
    db.deleteVideo(videoId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete video error:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
