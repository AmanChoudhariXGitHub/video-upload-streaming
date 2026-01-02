"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, File, CheckCircle2, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { socketClient } from "@/lib/socket-client"

const CHUNK_SIZE = 1024 * 1024 * 5 // 5MB chunks

interface UploadState {
  status: "idle" | "uploading" | "processing" | "complete" | "error"
  progress: number
  videoId?: string
  error?: string
  currentStep?: string
}

export function VideoUploader({ onComplete }: { onComplete?: (videoId: string) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    progress: 0,
  })

  useEffect(() => {
    const socket = socketClient.connect()

    socketClient.onUploadProgress((data) => {
      console.log("[v0] Upload progress:", data)
      setUploadState((prev) => ({
        ...prev,
        progress: data.progress,
      }))
    })

    socketClient.onUploadComplete((data) => {
      console.log("[v0] Upload complete:", data)
      setUploadState((prev) => ({
        ...prev,
        status: "processing",
        progress: 0,
      }))
    })

    socketClient.onProcessingStarted((data) => {
      console.log("[v0] Processing started:", data)
    })

    socketClient.onProcessingProgress((data) => {
      console.log("[v0] Processing progress:", data)
      setUploadState((prev) => ({
        ...prev,
        progress: data.totalProgress,
        currentStep: data.label,
      }))
    })

    socketClient.onProcessingCompleted((data) => {
      console.log("[v0] Processing completed:", data)
      setUploadState({
        status: "complete",
        progress: 100,
        videoId: data.videoId,
      })
      onComplete?.(data.videoId)
    })

    socketClient.onProcessingError((data) => {
      console.error("[v0] Processing error:", data)
      setUploadState({
        status: "error",
        progress: 0,
        error: data.error,
      })
    })

    return () => {
      socketClient.disconnect()
    }
  }, [onComplete])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""))
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setUploadState({ status: "uploading", progress: 0 })

      const { videoId } = await apiClient.initUpload(file.name, file.size, file.type, title, description)

      console.log("[v0] Upload initialized:", videoId)

      // Subscribe to video updates
      socketClient.subscribeToVideo(videoId)

      // Upload chunks
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file.size)
        const chunk = file.slice(start, end)

        await apiClient.uploadChunk(videoId, i, totalChunks, chunk)

        const progress = ((i + 1) / totalChunks) * 100
        setUploadState({
          status: "uploading",
          progress,
          videoId,
        })
      }

      // Complete upload
      await apiClient.completeUpload(videoId, totalChunks)

      setUploadState({
        status: "processing",
        progress: 0,
        videoId,
      })
    } catch (error) {
      console.error("[v0] Upload error:", error)
      setUploadState({
        status: "error",
        progress: 0,
        error: error instanceof Error ? error.message : "Upload failed",
      })
    }
  }

  const resetUploader = () => {
    if (uploadState.videoId) {
      socketClient.unsubscribeFromVideo(uploadState.videoId)
    }
    setFile(null)
    setTitle("")
    setDescription("")
    setUploadState({ status: "idle", progress: 0 })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Video</CardTitle>
        <CardDescription>Upload a video file to be processed and streamed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {uploadState.status === "idle" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="video-file">Video File</Label>
              <div className="flex items-center gap-2">
                <Input id="video-file" type="file" accept="video/*" onChange={handleFileChange} className="flex-1" />
                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <File className="h-4 w-4" />
                    <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                )}
              </div>
            </div>

            {file && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Video title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Video description"
                    rows={3}
                  />
                </div>

                <Button onClick={handleUpload} className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Video
                </Button>
              </>
            )}
          </>
        )}

        {(uploadState.status === "uploading" || uploadState.status === "processing") && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {uploadState.status === "uploading" ? "Uploading..." : uploadState.currentStep || "Processing..."}
                </span>
                <span className="text-muted-foreground">{uploadState.progress.toFixed(0)}%</span>
              </div>
              <Progress value={uploadState.progress} />
            </div>
            {uploadState.status === "processing" && (
              <Alert>
                <AlertDescription>
                  Your video is being processed. This may take a few minutes depending on the file size.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {uploadState.status === "complete" && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-500">
              Video uploaded and processed successfully!
              <Button onClick={resetUploader} variant="outline" size="sm" className="ml-4 bg-transparent">
                Upload Another
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {uploadState.status === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {uploadState.error || "An error occurred during upload"}
              <Button onClick={resetUploader} variant="outline" size="sm" className="ml-4 bg-transparent">
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
