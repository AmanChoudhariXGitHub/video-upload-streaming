import express from "express"
import { Video } from "../models/Video.js"
import { User } from "../models/User.js"
import { ProcessingJob } from "../models/ProcessingJob.js"
import { authenticate, authorize } from "../middleware/auth.js"

const router = express.Router()

// Get dashboard statistics
router.get("/stats", authenticate, authorize("admin"), async (req, res) => {
  try {
    const videos = await Video.find({ tenant: req.user.tenant })
    const users = await User.find({ tenant: req.user.tenant })
    const jobs = await ProcessingJob.find({})

    const stats = {
      totalVideos: videos.length,
      readyVideos: videos.filter((v) => v.status === "ready").length,
      processingVideos: videos.filter((v) => v.status === "processing").length,
      flaggedVideos: videos.filter((v) => v.sensitivity.status === "flagged").length,
      totalUsers: users.length,
      totalViews: videos.reduce((sum, v) => sum + (v.views || 0), 0),
      storageUsed: videos.reduce((sum, v) => sum + v.size, 0),
      recentJobs: jobs.slice(-10).reverse(),
    }

    res.json(stats)
  } catch (error) {
    console.error("Get stats error:", error)
    res.status(500).json({ error: "Failed to fetch statistics" })
  }
})

// Get all users
router.get("/users", authenticate, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find({ tenant: req.user.tenant })

    const usersWithoutPassword = users.map((user) => ({
      id: user._id,
      email: user.email,
      role: user.role,
      tenant: user.tenant,
      createdAt: user.createdAt,
    }))

    res.json(usersWithoutPassword)
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({ error: "Failed to fetch users" })
  }
})

// Update user role
router.put("/users/:id/role", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { role } = req.body

    if (!["admin", "editor", "viewer"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" })
    }

    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    if (user.tenant !== req.user.tenant) {
      return res.status(403).json({ error: "Unauthorized" })
    }

    await User.updateById(req.params.id, { role })

    res.json({ message: "User role updated successfully" })
  } catch (error) {
    console.error("Update user role error:", error)
    res.status(500).json({ error: "Failed to update user role" })
  }
})

// Approve/reject flagged video
router.put("/videos/:id/sensitivity", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { status } = req.body

    if (!["safe", "flagged"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" })
    }

    const video = await Video.findById(req.params.id)

    if (!video) {
      return res.status(404).json({ error: "Video not found" })
    }

    if (video.tenant !== req.user.tenant) {
      return res.status(403).json({ error: "Unauthorized" })
    }

    await Video.updateById(req.params.id, {
      "sensitivity.status": status,
      status: status === "safe" ? "ready" : "flagged",
    })

    res.json({ message: "Video sensitivity status updated" })
  } catch (error) {
    console.error("Update sensitivity error:", error)
    res.status(500).json({ error: "Failed to update sensitivity status" })
  }
})

// Get processing jobs
router.get("/jobs", authenticate, authorize("admin"), async (req, res) => {
  try {
    const jobs = await ProcessingJob.find({})
    res.json(jobs)
  } catch (error) {
    console.error("Get jobs error:", error)
    res.status(500).json({ error: "Failed to fetch processing jobs" })
  }
})

export default router
