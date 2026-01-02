import express from "express"
import multer from "multer"
import { Video } from "../models/Video.js"
import { authenticate, authorize, tenantIsolation } from "../middleware/auth.js"
import { saveChunk, assembleChunks, getFilePath, deleteFile } from "../utils/fileStorage.js"

const router = express.Router()

// Configure multer for chunked uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per chunk
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"]
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Invalid file type. Only video files are allowed."))
    }
  },
})

// Initialize upload
router.post("/init", authenticate, authorize("admin", "editor"), async (req, res) => {
  try {
    const { filename, filesize, mimetype, title, description } = req.body

    if (!filename || !filesize || !mimetype) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // Create video record
    const video = await Video.create({
      title: title || filename,
      description: description || "",
      filename: `${Date.now()}-${filename}`,
      originalName: filename,
      size: filesize,
      mimeType: mimetype,
      userId: req.user._id,
      tenant: req.user.tenant,
      status: "uploading",
      processingProgress: 0,
    })

    res.status(201).json({
      videoId: video._id,
      message: "Upload initialized",
    })
  } catch (error) {
    console.error("Upload init error:", error)
    res.status(500).json({ error: "Failed to initialize upload" })
  }
})

// Upload chunk
router.post("/chunk", authenticate, authorize("admin", "editor"), upload.single("chunk"), async (req, res) => {
  try {
    const { videoId, chunkIndex, totalChunks } = req.body

    if (!videoId || chunkIndex === undefined || !totalChunks || !req.file) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // Verify video exists and belongs to user
    const video = await Video.findById(videoId)
    if (!video) {
      return res.status(404).json({ error: "Video not found" })
    }

    if (video.userId !== req.user._id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" })
    }

    // Save chunk
    await saveChunk(videoId, Number.parseInt(chunkIndex), req.file.buffer)

    const progress = ((Number.parseInt(chunkIndex) + 1) / Number.parseInt(totalChunks)) * 100

    // Update video progress
    await Video.updateById(videoId, {
      processingProgress: Math.min(progress, 100),
    })

    // Emit progress via Socket.io
    const io = req.app.get("io")
    io.to(`video:${videoId}`).emit("upload:progress", {
      videoId,
      progress: Math.min(progress, 100),
      chunkIndex: Number.parseInt(chunkIndex),
      totalChunks: Number.parseInt(totalChunks),
    })

    res.json({
      success: true,
      chunkIndex: Number.parseInt(chunkIndex),
      progress: Math.min(progress, 100),
    })
  } catch (error) {
    console.error("Chunk upload error:", error)
    res.status(500).json({ error: "Failed to upload chunk" })
  }
})

// Complete upload
router.post("/complete", authenticate, authorize("admin", "editor"), async (req, res) => {
  try {
    const { videoId, totalChunks } = req.body

    if (!videoId || !totalChunks) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // Verify video exists
    const video = await Video.findById(videoId)
    if (!video) {
      return res.status(404).json({ error: "Video not found" })
    }

    if (video.userId !== req.user._id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" })
    }

    // Assemble chunks
    const filepath = await assembleChunks(videoId, Number.parseInt(totalChunks), video.filename)

    // Update video status
    await Video.updateById(videoId, {
      status: "processing",
      processingProgress: 0,
    })

    // Emit completion event
    const io = req.app.get("io")
    io.to(`video:${videoId}`).emit("upload:complete", {
      videoId,
      message: "Upload complete, processing started",
    })

    const videoProcessor = req.app.get("videoProcessor")
    await videoProcessor.addToQueue(videoId)

    res.json({
      success: true,
      videoId,
      message: "Upload complete, processing started",
    })
  } catch (error) {
    console.error("Upload complete error:", error)
    res.status(500).json({ error: "Failed to complete upload" })
  }
})

// Get all videos (with tenant isolation and role-based filtering)
router.get("/", authenticate, tenantIsolation, async (req, res) => {
  try {
    let videos

    if (req.user.role === "admin") {
      // Admins see all videos in their tenant
      videos = await Video.find({ tenant: req.tenant })
    } else if (req.user.role === "editor") {
      // Editors see their own videos
      videos = await Video.find({ userId: req.user._id, tenant: req.tenant })
    } else {
      // Viewers see only ready, safe videos
      videos = await Video.find({
        tenant: req.tenant,
        status: "ready",
        "sensitivity.status": "safe",
      })
    }

    res.json(videos)
  } catch (error) {
    console.error("Get videos error:", error)
    res.status(500).json({ error: "Failed to fetch videos" })
  }
})

// Get single video
router.get("/:id", authenticate, tenantIsolation, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)

    if (!video) {
      return res.status(404).json({ error: "Video not found" })
    }

    // Check permissions
    if (video.tenant !== req.tenant) {
      return res.status(403).json({ error: "Unauthorized" })
    }

    if (req.user.role === "viewer") {
      if (video.status !== "ready" || video.sensitivity.status !== "safe") {
        return res.status(403).json({ error: "Video not available" })
      }
    } else if (req.user.role === "editor") {
      if (video.userId !== req.user._id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Unauthorized" })
      }
    }

    res.json(video)
  } catch (error) {
    console.error("Get video error:", error)
    res.status(500).json({ error: "Failed to fetch video" })
  }
})

// Update video metadata
router.put("/:id", authenticate, authorize("admin", "editor"), async (req, res) => {
  try {
    const { title, description } = req.body
    const video = await Video.findById(req.params.id)

    if (!video) {
      return res.status(404).json({ error: "Video not found" })
    }

    // Check ownership
    if (video.userId !== req.user._id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" })
    }

    const updates = {}
    if (title) updates.title = title
    if (description !== undefined) updates.description = description

    const updatedVideo = await Video.updateById(req.params.id, updates)

    res.json(updatedVideo)
  } catch (error) {
    console.error("Update video error:", error)
    res.status(500).json({ error: "Failed to update video" })
  }
})

// Delete video
router.delete("/:id", authenticate, authorize("admin", "editor"), async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)

    if (!video) {
      return res.status(404).json({ error: "Video not found" })
    }

    // Check ownership
    if (video.userId !== req.user._id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" })
    }

    // Delete files
    const filepath = await getFilePath(video.filename)
    await deleteFile(filepath)

    // Delete video record
    await Video.deleteById(req.params.id)

    res.json({ message: "Video deleted successfully" })
  } catch (error) {
    console.error("Delete video error:", error)
    res.status(500).json({ error: "Failed to delete video" })
  }
})

export default router
