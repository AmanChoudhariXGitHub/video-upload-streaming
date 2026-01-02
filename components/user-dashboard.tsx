"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { VideoUploader } from "./video-uploader"
import { VideoPlayer } from "./video-player"
import { useAuth } from "./auth-provider"
import { Video, Eye, Clock, CheckCircle2, AlertTriangle, Trash2, Edit2, Play } from "lucide-react"
import { apiClient } from "@/lib/api-client"

export function UserDashboard() {
  const { user, logout } = useAuth()
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingVideo, setEditingVideo] = useState<any>(null)
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: "", description: "" })

  useEffect(() => {
    loadVideos()
  }, [])

  const loadVideos = async () => {
    try {
      const data = await apiClient.getVideos()
      setVideos(data)
    } catch (error) {
      console.error("[v0] Load videos error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadComplete = () => {
    loadVideos()
  }

  const openEditDialog = (video: any) => {
    setEditingVideo(video)
    setEditForm({
      title: video.title,
      description: video.description || "",
    })
  }

  const handleUpdateVideo = async () => {
    if (!editingVideo) return

    try {
      await apiClient.updateVideo(editingVideo._id, editForm)
      setEditingVideo(null)
      loadVideos()
    } catch (error) {
      console.error("[v0] Update video error:", error)
    }
  }

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return

    try {
      await apiClient.deleteVideo(videoId)
      loadVideos()
    } catch (error) {
      console.error("[v0] Delete video error:", error)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  const stats = {
    totalVideos: videos.length,
    totalViews: videos.reduce((sum, v) => sum + (v.views || 0), 0),
    readyVideos: videos.filter((v) => v.status === "ready").length,
    processingVideos: videos.filter((v) => v.status === "processing").length,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold">My Videos</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {user?.email}</p>
          </div>
          <Button onClick={logout} variant="outline">
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVideos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.readyVideos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.processingVideos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews}</div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        <VideoUploader onComplete={handleUploadComplete} />

        {/* Video Player Dialog */}
        {playingVideo && (
          <Dialog open={!!playingVideo} onOpenChange={() => setPlayingVideo(null)}>
            <DialogContent className="max-w-4xl">
              <VideoPlayer videoId={playingVideo} autoplay />
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Video Dialog */}
        {editingVideo && (
          <Dialog open={!!editingVideo} onOpenChange={() => setEditingVideo(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Video</DialogTitle>
                <DialogDescription>Update your video information</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingVideo(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateVideo}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Video Grid */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Your Videos</h2>

          {videos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Video className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium">No videos yet</h3>
                <p className="text-sm text-muted-foreground">Upload your first video to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {videos.map((video) => (
                <Card key={video._id} className="overflow-hidden">
                  <div className="relative aspect-video bg-muted">
                    {video.thumbnail ? (
                      <img
                        src={apiClient.getThumbnailUrl(video._id) || "/placeholder.svg"}
                        alt={video.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Video className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}

                    {video.status === "ready" && (
                      <button
                        onClick={() => setPlayingVideo(video._id)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100"
                      >
                        <Play className="h-16 w-16 text-white" />
                      </button>
                    )}

                    <div className="absolute right-2 top-2 flex gap-2">
                      <Badge
                        variant={
                          video.status === "ready" ? "default" : video.status === "failed" ? "destructive" : "secondary"
                        }
                      >
                        {video.status}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="space-y-2">
                    <CardTitle className="line-clamp-1 text-base">{video.title}</CardTitle>
                    <CardDescription className="line-clamp-2 text-sm">
                      {video.description || "No description"}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {video.views || 0} views
                      </span>
                      <span>{formatDate(video.createdAt)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>Size: {formatBytes(video.size)}</div>
                      <div>Format: {video.mimeType?.split("/")[1] || "N/A"}</div>
                    </div>

                    {video.sensitivity?.status === "flagged" && (
                      <div className="flex items-center gap-2 rounded-md border border-yellow-500/50 bg-yellow-500/10 p-2 text-xs text-yellow-500">
                        <AlertTriangle className="h-3 w-3" />
                        Flagged for review
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(video)} className="flex-1">
                        <Edit2 className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteVideo(video._id)}
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
