import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import db from "@/lib/db"
import { saveChunk, assembleChunks } from "@/lib/file-storage"
import { processVideo } from "@/lib/video-processor"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const formData = await request.formData()

    const videoId = formData.get("videoId") as string
    const chunkIndex = Number.parseInt(formData.get("chunkIndex") as string)
    const totalChunks = Number.parseInt(formData.get("totalChunks") as string)
    const chunk = formData.get("chunk") as Blob

    if (!videoId || isNaN(chunkIndex) || isNaN(totalChunks) || !chunk) {
      return NextResponse.json({ error: "Invalid chunk data" }, { status: 400 })
    }

    // Verify video belongs to user
    const video = db.getVideoById(videoId)
    if (!video || video.userId !== user._id) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Save chunk
    const buffer = Buffer.from(await chunk.arrayBuffer())
    await saveChunk(videoId, chunkIndex, buffer)

    // Check if all chunks uploaded
    const isLastChunk = chunkIndex === totalChunks - 1

    if (isLastChunk) {
      // Assemble all chunks
      const finalPath = await assembleChunks(videoId, totalChunks, video.filename)

      // Update video record
      db.updateVideo(videoId, {
        originalPath: finalPath,
        status: "processing",
      })

      processVideo(videoId).catch((error) => {
        console.error("[v0] Auto-processing error:", error)
      })

      return NextResponse.json({
        success: true,
        complete: true,
        message: "Upload complete, processing started",
      })
    }

    return NextResponse.json({
      success: true,
      complete: false,
      progress: ((chunkIndex + 1) / totalChunks) * 100,
    })
  } catch (error) {
    console.error("[v0] Chunk upload error:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
