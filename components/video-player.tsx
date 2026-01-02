"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, Volume2, VolumeX, Maximize, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiClient } from "@/lib/api-client"

interface VideoPlayerProps {
  videoId: string
  autoplay?: boolean
  controls?: boolean
}

export function VideoPlayer({ videoId, autoplay = false, controls = true }: VideoPlayerProps) {
  const [video, setVideo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    loadVideo()
  }, [videoId])

  const loadVideo = async () => {
    try {
      const data = await apiClient.getVideo(videoId)

      if (data.status !== "ready") {
        setError("Video is not ready for playback")
        return
      }

      if (data.sensitivity?.status === "flagged") {
        setError("This video contains sensitive content and is pending review")
        return
      }

      setVideo(data)
      setDuration(data.duration || 300) // Default 5 minutes for simulation

      // Track view
      await apiClient.trackView(videoId)
    } catch (err) {
      console.error("[v0] Video load error:", err)
      setError("Failed to load video")
    }
  }

  useEffect(() => {
    if (autoplay && video) {
      handlePlayPause()
    }
  }, [video])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false)
            return duration
          }
          return prev + 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, duration])

  const handlePlayPause = () => {
    if (!video) return
    setIsPlaying(!isPlaying)
  }

  const handleMuteToggle = () => {
    setIsMuted(!isMuted)
  }

  const handleFullscreen = () => {
    const container = videoRef.current?.parentElement
    if (container?.requestFullscreen) {
      container.requestFullscreen()
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number.parseFloat(e.target.value)
    setCurrentTime(time)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!video) {
    return (
      <Card>
        <CardContent className="flex h-96 items-center justify-center">
          <div className="text-center text-muted-foreground">Loading video...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="relative bg-black">
          {/* Video display area */}
          <div className="relative aspect-video bg-black">
            {video.thumbnail ? (
              <img
                src={apiClient.getThumbnailUrl(videoId) || "/placeholder.svg"}
                alt={video.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <Play className="h-16 w-16 text-muted-foreground" />
              </div>
            )}

            {/* Simulated video playback overlay */}
            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="text-center text-white">
                  <div className="text-6xl font-bold">{formatTime(currentTime)}</div>
                  <div className="text-sm text-white/70">Simulated playback</div>
                  <div className="mt-2 text-xs text-white/50">Stream URL: {apiClient.getStreamUrl(videoId)}</div>
                </div>
              </div>
            )}

            {/* Hidden video element for future real streaming */}
            <video
              ref={videoRef}
              className="hidden h-full w-full"
              src={apiClient.getStreamUrl(videoId)}
              muted={isMuted}
            />
          </div>

          {/* Custom controls */}
          {controls && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
              {/* Progress bar */}
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={handleSeek}
                className="mb-2 w-full cursor-pointer"
              />

              {/* Control buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handlePlayPause}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleMuteToggle}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>

                  <div className="text-sm text-white">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-sm text-white/70">{video.views || 0} views</div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleFullscreen}
                    className="text-white hover:bg-white/20"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Video info */}
        <div className="p-4">
          <h3 className="text-lg font-semibold">{video.title}</h3>
          {video.description && <p className="mt-1 text-sm text-muted-foreground">{video.description}</p>}
          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            <span>{formatBytes(video.size)}</span>
            <span>{video.mimeType}</span>
            {video.sensitivity?.status && (
              <span className={video.sensitivity.status === "safe" ? "text-green-500" : "text-yellow-500"}>
                {video.sensitivity.status}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
}
