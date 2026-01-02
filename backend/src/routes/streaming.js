import express from "express"
import { Video } from "../models/Video.js"
import { authenticate, tenantIsolation } from "../middleware/auth.js"
import { getFilePath, createReadStream, getFileStats } from "../utils/fileStorage.js"

const router = express.Router()

// Stream video with HTTP range support
router.get("/:id/video", authenticate, tenantIsolation, async (req, res) => {
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
    }

    const videoPath = await getFilePath(video.filename)
    const stats = await getFileStats(videoPath)

    if (!stats) {
      return res.status(404).json({ error: "Video file not found" })
    }

    const fileSize = stats.size
    const range = req.headers.range

    if (range) {
      // Parse Range header
      const parts = range.replace(/bytes=/, "").split("-")
      const start = Number.parseInt(parts[0], 10)
      const end = parts[1] ? Number.parseInt(parts[1], 10) : fileSize - 1
      const chunksize = end - start + 1

      // Create read stream for the requested range
      const fs = await import("fs")
      const stream = fs.createReadStream(videoPath, { start, end })

      // Set response headers for partial content
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": video.mimeType,
      })

      stream.pipe(res)
    } else {
      // Stream entire file
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": video.mimeType,
      })

      const stream = await createReadStream(videoPath)
      stream.pipe(res)
    }

    // Track view (increment once per request)
    await Video.updateById(video._id, {
      views: (video.views || 0) + 1,
    })
  } catch (error) {
    console.error("Stream video error:", error)
    res.status(500).json({ error: "Failed to stream video" })
  }
})

// Get HLS manifest
router.get("/:id/video.m3u8", authenticate, tenantIsolation, async (req, res) => {
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
    }

    // Generate HLS master playlist (simulated)
    const manifest = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
/api/stream/${video._id}/video?quality=1080p
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
/api/stream/${video._id}/video?quality=720p
#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=854x480
/api/stream/${video._id}/video?quality=480p`

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl")
    res.send(manifest)
  } catch (error) {
    console.error("HLS manifest error:", error)
    res.status(500).json({ error: "Failed to generate manifest" })
  }
})

// Get DASH manifest
router.get("/:id/manifest.mpd", authenticate, tenantIsolation, async (req, res) => {
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
    }

    // Generate DASH manifest (simulated)
    const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" type="static">
  <Period>
    <AdaptationSet mimeType="video/mp4">
      <Representation id="1080p" bandwidth="5000000" width="1920" height="1080">
        <BaseURL>/api/stream/${video._id}/video?quality=1080p</BaseURL>
      </Representation>
      <Representation id="720p" bandwidth="2800000" width="1280" height="720">
        <BaseURL>/api/stream/${video._id}/video?quality=720p</BaseURL>
      </Representation>
      <Representation id="480p" bandwidth="1400000" width="854" height="480">
        <BaseURL>/api/stream/${video._id}/video?quality=480p</BaseURL>
      </Representation>
    </AdaptationSet>
  </Period>
</MPD>`

    res.setHeader("Content-Type", "application/dash+xml")
    res.send(manifest)
  } catch (error) {
    console.error("DASH manifest error:", error)
    res.status(500).json({ error: "Failed to generate manifest" })
  }
})

// Get thumbnail
router.get("/:id/thumbnail", authenticate, tenantIsolation, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)

    if (!video) {
      return res.status(404).json({ error: "Video not found" })
    }

    // Check permissions
    if (video.tenant !== req.tenant) {
      return res.status(403).json({ error: "Unauthorized" })
    }

    if (!video.thumbnail) {
      return res.status(404).json({ error: "Thumbnail not found" })
    }

    const thumbnailPath = await getFilePath(video.thumbnail, "thumbnails")
    const stats = await getFileStats(thumbnailPath)

    if (!stats) {
      // Return placeholder if thumbnail doesn't exist
      return res.redirect(`/placeholder.svg?width=640&height=360&text=${encodeURIComponent(video.title)}`)
    }

    res.setHeader("Content-Type", "image/jpeg")
    res.setHeader("Cache-Control", "public, max-age=86400")

    const stream = await createReadStream(thumbnailPath)
    stream.pipe(res)
  } catch (error) {
    console.error("Thumbnail error:", error)
    res.status(500).json({ error: "Failed to fetch thumbnail" })
  }
})

export default router
