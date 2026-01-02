"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, Volume2, VolumeX, Maximize, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface VideoPlayerProps {
  videoId: string
  autoplay?: boolean
  controls?: boolean
}

export function VideoPlayer({ videoId, autoplay = false, controls = true }: VideoPlayerProps) {
  const [manifest, setManifest] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    loadManifest()
  }, [videoId])

  const loadManifest = async () => {
    try {
      const response = await fetch(`/api/stream/${videoId}/manifest`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to load video")
        return
      }

      if (data.sensitivityStatus === "flagged") {
        setError("This video contains sensitive content and is pending review")
        return
      }

      setManifest(data)
      setDuration(data.duration || 0)

      // Track view
      trackEvent("view")
    } catch (err) {
      console.error("[v0] Manifest load error:", err)
      setError("Failed to load video")
    }
  }

  const trackEvent = async (event: string, metadata?: any) => {
    try {
      await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, event, metadata }),
      })
    } catch (err) {
      console.error("[v0] Analytics error:", err)
    }
  }

  const handlePlayPause = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
      trackEvent("pause", { currentTime })
    } else {
      videoRef.current.play()
      trackEvent("play", { currentTime })
    }

    setIsPlaying(!isPlaying)
  }

  const handleMuteToggle = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleFullscreen = () => {
    if (!videoRef.current) return
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen()
    }
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    setCurrentTime(videoRef.current.currentTime)
  }

  const handleEnded = () => {
    setIsPlaying(false)
    trackEvent("complete", { duration: currentTime })
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return
    const time = Number.parseFloat(e.target.value)
    videoRef.current.currentTime = time
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

  if (!manifest) {
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
          {/* Video element - simulated streaming */}
          <div className="relative aspect-video bg-black">
            {manifest.thumbnail ? (
              <img
                src={manifest.thumbnail || "/placeholder.svg"}
                alt={manifest.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <Play className="h-16 w-16 text-muted-foreground" />
              </div>
            )}

            {/* Simulated video playback overlay */}
            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  <div className="text-6xl font-bold">{formatTime(currentTime)}</div>
                  <div className="text-sm text-white/70">Video playing (simulated)</div>
                </div>
              </div>
            )}

            {/* Hidden video element for future real streaming */}
            <video
              ref={videoRef}
              className="hidden h-full w-full"
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              autoPlay={autoplay}
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
                  <div className="text-sm text-white/70">{manifest.views} views</div>
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
          <h3 className="text-lg font-semibold">{manifest.title}</h3>
          {manifest.description && <p className="mt-1 text-sm text-muted-foreground">{manifest.description}</p>}
          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            <span>{manifest.resolution}</span>
            <span>{formatTime(manifest.duration)}</span>
            {manifest.sensitivityStatus && (
              <span className={manifest.sensitivityStatus === "safe" ? "text-green-500" : "text-yellow-500"}>
                {manifest.sensitivityStatus}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
