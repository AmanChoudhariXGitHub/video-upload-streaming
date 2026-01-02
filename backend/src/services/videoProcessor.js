import { Video } from "../models/Video.js"
import { ProcessingJob } from "../models/ProcessingJob.js"

const PROCESSING_STEPS = [
  { name: "format_conversion", duration: 3000, label: "Converting format" },
  { name: "compression", duration: 4000, label: "Compressing video" },
  { name: "generate_thumbnails", duration: 2000, label: "Generating thumbnails" },
  { name: "create_streams", duration: 3000, label: "Creating streaming formats" },
  { name: "sensitivity_analysis", duration: 2500, label: "Analyzing content" },
]

export class VideoProcessor {
  constructor(io) {
    this.io = io
    this.processingQueue = []
    this.isProcessing = false
  }

  async addToQueue(videoId) {
    this.processingQueue.push(videoId)
    console.log(`Video ${videoId} added to processing queue`)

    if (!this.isProcessing) {
      this.processNext()
    }
  }

  async processNext() {
    if (this.processingQueue.length === 0) {
      this.isProcessing = false
      return
    }

    this.isProcessing = true
    const videoId = this.processingQueue.shift()

    try {
      await this.processVideo(videoId)
    } catch (error) {
      console.error(`Failed to process video ${videoId}:`, error)
      await this.handleProcessingError(videoId, error)
    }

    // Process next video
    setTimeout(() => this.processNext(), 1000)
  }

  async processVideo(videoId) {
    console.log(`Starting processing for video ${videoId}`)

    const video = await Video.findById(videoId)
    if (!video) {
      throw new Error("Video not found")
    }

    // Create processing job
    const job = await ProcessingJob.create({
      videoId,
      status: "processing",
      progress: 0,
      steps: PROCESSING_STEPS.map((step) => ({
        name: step.name,
        status: "pending",
        progress: 0,
      })),
    })

    // Update video status
    await Video.updateById(videoId, {
      status: "processing",
      processingProgress: 0,
    })

    // Emit start event
    this.io.to(`video:${videoId}`).emit("processing:started", {
      videoId,
      jobId: job._id,
    })

    // Process each step
    for (let i = 0; i < PROCESSING_STEPS.length; i++) {
      const step = PROCESSING_STEPS[i]
      await this.processStep(videoId, job._id, step, i)
    }

    // Finalize processing
    await this.finalizeProcessing(videoId, job._id)
  }

  async processStep(videoId, jobId, step, stepIndex) {
    console.log(`Processing step: ${step.label} for video ${videoId}`)

    // Update job step status
    const job = await ProcessingJob.findById(jobId)
    job.steps[stepIndex].status = "processing"
    job.steps[stepIndex].startedAt = new Date()
    job.currentStep = step.label
    await ProcessingJob.updateById(jobId, {
      steps: job.steps,
      currentStep: step.label,
    })

    // Emit step started
    this.io.to(`video:${videoId}`).emit("processing:step", {
      videoId,
      step: step.name,
      label: step.label,
      status: "processing",
    })

    // Simulate processing with progress updates
    const progressSteps = 10
    const progressInterval = step.duration / progressSteps

    for (let i = 0; i <= progressSteps; i++) {
      await new Promise((resolve) => setTimeout(resolve, progressInterval))

      const stepProgress = (i / progressSteps) * 100
      const totalProgress = ((stepIndex + i / progressSteps) / PROCESSING_STEPS.length) * 100

      // Update job progress
      job.steps[stepIndex].progress = stepProgress
      job.progress = totalProgress
      await ProcessingJob.updateById(jobId, {
        steps: job.steps,
        progress: totalProgress,
      })

      // Update video progress
      await Video.updateById(videoId, {
        processingProgress: totalProgress,
      })

      // Emit progress
      this.io.to(`video:${videoId}`).emit("processing:progress", {
        videoId,
        step: step.name,
        stepProgress,
        totalProgress,
        label: step.label,
      })
    }

    // Mark step as completed
    job.steps[stepIndex].status = "completed"
    job.steps[stepIndex].completedAt = new Date()
    await ProcessingJob.updateById(jobId, {
      steps: job.steps,
    })

    // Execute step-specific logic
    await this.executeStepLogic(videoId, step.name)

    // Emit step completed
    this.io.to(`video:${videoId}`).emit("processing:step", {
      videoId,
      step: step.name,
      label: step.label,
      status: "completed",
    })
  }

  async executeStepLogic(videoId, stepName) {
    const video = await Video.findById(videoId)

    switch (stepName) {
      case "format_conversion":
        // Simulate format conversion
        await Video.updateById(videoId, {
          formats: [
            { quality: "1080p", format: "mp4", path: video.filename, size: video.size },
            {
              quality: "720p",
              format: "mp4",
              path: video.filename.replace(".mp4", "-720p.mp4"),
              size: video.size * 0.6,
            },
            {
              quality: "480p",
              format: "mp4",
              path: video.filename.replace(".mp4", "-480p.mp4"),
              size: video.size * 0.3,
            },
          ],
        })
        break

      case "generate_thumbnails":
        // Simulate thumbnail generation
        const thumbnailFilename = video.filename.replace(/\.[^.]+$/, "-thumb.jpg")
        await Video.updateById(videoId, {
          thumbnail: thumbnailFilename,
        })
        break

      case "create_streams":
        // Simulate HLS/DASH stream creation
        await Video.updateById(videoId, {
          streamUrl: `/api/stream/${videoId}/video.m3u8`,
          manifestUrl: `/api/stream/${videoId}/manifest.mpd`,
        })
        break

      case "sensitivity_analysis":
        // Simulate content analysis
        const isFlagged = Math.random() < 0.2 // 20% chance of flagged content

        await Video.updateById(videoId, {
          sensitivity: {
            status: isFlagged ? "flagged" : "safe",
            confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
            reasons: isFlagged ? ["Potential sensitive content detected", "Manual review recommended"] : [],
          },
        })
        break
    }
  }

  async finalizeProcessing(videoId, jobId) {
    console.log(`Finalizing processing for video ${videoId}`)

    // Update job status
    await ProcessingJob.updateById(jobId, {
      status: "completed",
      progress: 100,
      completedAt: new Date(),
    })

    const video = await Video.findById(videoId)

    // Update video status
    await Video.updateById(videoId, {
      status: video.sensitivity.status === "flagged" ? "flagged" : "ready",
      processingProgress: 100,
    })

    // Emit completion
    this.io.to(`video:${videoId}`).emit("processing:completed", {
      videoId,
      status: video.sensitivity.status === "flagged" ? "flagged" : "ready",
      sensitivity: video.sensitivity,
    })

    console.log(`Processing completed for video ${videoId}`)
  }

  async handleProcessingError(videoId, error) {
    console.error(`Processing error for video ${videoId}:`, error)

    await Video.updateById(videoId, {
      status: "failed",
      processingProgress: 0,
    })

    this.io.to(`video:${videoId}`).emit("processing:error", {
      videoId,
      error: error.message,
    })
  }
}

export function createVideoProcessor(io) {
  return new VideoProcessor(io)
}
