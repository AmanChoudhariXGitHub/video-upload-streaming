import express from "express"
import { Video } from "../models/Video.js"
import { User } from "../models/User.js"
import { authenticate, authorize, tenantIsolation } from "../middleware/auth.js"

const router = express.Router()

// Track video view
router.post("/track/view", authenticate, tenantIsolation, async (req, res) => {
  try {
    const { videoId, watchTime, quality } = req.body

    if (!videoId) {
      return res.status(400).json({ error: "Video ID is required" })
    }

    const video = await Video.findById(videoId)

    if (!video) {
      return res.status(404).json({ error: "Video not found" })
    }

    // Check permissions
    if (video.tenant !== req.tenant) {
      return res.status(403).json({ error: "Unauthorized" })
    }

    // In a real app, you would store this in an analytics collection
    // For now, we just increment views
    await Video.updateById(videoId, {
      views: (video.views || 0) + 1,
    })

    res.json({ success: true })
  } catch (error) {
    console.error("Track view error:", error)
    res.status(500).json({ error: "Failed to track view" })
  }
})

// Get video analytics (admin only)
router.get("/video/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)

    if (!video) {
      return res.status(404).json({ error: "Video not found" })
    }

    if (video.tenant !== req.user.tenant) {
      return res.status(403).json({ error: "Unauthorized" })
    }

    const analytics = {
      videoId: video._id,
      title: video.title,
      views: video.views || 0,
      status: video.status,
      uploadDate: video.createdAt,
      size: video.size,
      duration: video.duration,
      // In a real app, you would fetch detailed analytics from a separate collection
      watchTimeTotal: Math.floor(Math.random() * 10000),
      averageWatchTime: Math.floor(Math.random() * 300),
      completionRate: Math.random() * 100,
    }

    res.json(analytics)
  } catch (error) {
    console.error("Get analytics error:", error)
    res.status(500).json({ error: "Failed to fetch analytics" })
  }
})

// Get platform-wide analytics (admin only)
router.get("/platform", authenticate, authorize("admin"), tenantIsolation, async (req, res) => {
  try {
    const videos = await Video.find({ tenant: req.tenant })
    const users = await User.find({ tenant: req.tenant })

    const analytics = {
      totalVideos: videos.length,
      totalUsers: users.length,
      totalViews: videos.reduce((sum, v) => sum + (v.views || 0), 0),
      totalStorage: videos.reduce((sum, v) => sum + v.size, 0),
      videosByStatus: {
        ready: videos.filter((v) => v.status === "ready").length,
        processing: videos.filter((v) => v.status === "processing").length,
        uploading: videos.filter((v) => v.status === "uploading").length,
        failed: videos.filter((v) => v.status === "failed").length,
        flagged: videos.filter((v) => v.status === "flagged").length,
      },
      sensitivityStats: {
        safe: videos.filter((v) => v.sensitivity?.status === "safe").length,
        flagged: videos.filter((v) => v.sensitivity?.status === "flagged").length,
        pending: videos.filter((v) => v.sensitivity?.status === "pending").length,
      },
      topVideos: videos
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 10)
        .map((v) => ({
          id: v._id,
          title: v.title,
          views: v.views || 0,
        })),
    }

    res.json(analytics)
  } catch (error) {
    console.error("Get platform analytics error:", error)
    res.status(500).json({ error: "Failed to fetch platform analytics" })
  }
})

export default router
