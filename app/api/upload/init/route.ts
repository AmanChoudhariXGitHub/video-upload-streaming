import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import db from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { filename, size, title, description } = await request.json()

    if (!filename || !size) {
      return NextResponse.json({ error: "Filename and size are required" }, { status: 400 })
    }

    // Validate file type
    const allowedExtensions = [".mp4", ".mov", ".avi", ".mkv", ".webm"]
    const ext = filename.toLowerCase().substring(filename.lastIndexOf("."))

    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json({ error: "Invalid file type. Allowed: MP4, MOV, AVI, MKV, WEBM" }, { status: 400 })
    }

    // Create video record
    const video = db.createVideo({
      userId: user._id,
      title: title || filename,
      description: description || "",
      filename,
      originalPath: "",
      status: "uploading",
      sensitivityStatus: "pending",
      size,
      format: ext.substring(1),
    })

    return NextResponse.json({
      success: true,
      videoId: video._id,
      uploadUrl: `/api/upload/chunk`,
    })
  } catch (error) {
    console.error("[v0] Upload init error:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
