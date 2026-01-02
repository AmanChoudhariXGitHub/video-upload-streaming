import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import db from "@/lib/db"
import cdn from "@/lib/cdn-simulator"

export async function GET() {
  try {
    await requireAdmin()

    const videos = db.getAllVideos()
    const users = db.getAllUsers()
    const jobs = db.getAllJobs()

    const stats = {
      totalVideos: videos.length,
      totalUsers: users.length,
      totalViews: videos.reduce((sum, v) => sum + v.views, 0),
      videosByStatus: {
        uploading: videos.filter((v) => v.status === "uploading").length,
        processing: videos.filter((v) => v.status === "processing").length,
        ready: videos.filter((v) => v.status === "ready").length,
        failed: videos.filter((v) => v.status === "failed").length,
      },
      videosBySensitivity: {
        pending: videos.filter((v) => v.sensitivityStatus === "pending").length,
        safe: videos.filter((v) => v.sensitivityStatus === "safe").length,
        flagged: videos.filter((v) => v.sensitivityStatus === "flagged").length,
      },
      jobsByStatus: {
        pending: jobs.filter((j) => j.status === "pending").length,
        processing: jobs.filter((j) => j.status === "processing").length,
        completed: jobs.filter((j) => j.status === "completed").length,
        failed: jobs.filter((j) => j.status === "failed").length,
      },
      cdn: cdn.getStats(),
      storageSize: videos.reduce((sum, v) => sum + v.size, 0),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("[v0] Admin get stats error:", error)

    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
