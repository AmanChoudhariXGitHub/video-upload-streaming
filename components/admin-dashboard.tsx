"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Video, Users, Eye, AlertTriangle, CheckCircle2, XCircle, Clock, Trash2, Database } from "lucide-react"
import { useAuth } from "./auth-provider"
import { apiClient } from "@/lib/api-client"

export function AdminDashboard() {
  const { logout } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [videos, setVideos] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsData, videosData, usersData] = await Promise.all([
        apiClient.getAdminStats(),
        apiClient.getVideos(),
        apiClient.getUsers(),
      ])

      setStats(statsData)
      setVideos(videosData)
      setUsers(usersData)
    } catch (error) {
      console.error("[v0] Load data error:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateVideoSensitivity = async (videoId: string, status: string) => {
    try {
      await apiClient.updateVideoSensitivity(videoId, status)
      loadData()
    } catch (error) {
      console.error("[v0] Update video error:", error)
    }
  }

  const deleteVideo = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return

    try {
      await apiClient.deleteVideo(videoId)
      loadData()
    } catch (error) {
      console.error("[v0] Delete video error:", error)
    }
  }

  const updateUserRole = async (userId: string, role: string) => {
    try {
      await apiClient.updateUserRole(userId, role)
      loadData()
    } catch (error) {
      console.error("[v0] Update user role error:", error)
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
    return new Date(date).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button onClick={logout} variant="outline">
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalVideos || 0}</div>
              <p className="text-xs text-muted-foreground">{stats?.readyVideos || 0} ready to stream</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalViews || 0}</div>
              <p className="text-xs text-muted-foreground">Across all videos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(stats?.storageUsed || 0)}</div>
              <p className="text-xs text-muted-foreground">Total storage</p>
            </CardContent>
          </Card>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Video Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Ready
                </span>
                <span className="font-medium">{stats?.readyVideos || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Processing
                </span>
                <span className="font-medium">{stats?.processingVideos || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Failed
                </span>
                <span className="font-medium">0</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Content Sensitivity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Safe
                </span>
                <span className="font-medium">{videos.filter((v) => v.sensitivity?.status === "safe").length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Flagged
                </span>
                <span className="font-medium">{stats?.flaggedVideos || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Pending
                </span>
                <span className="font-medium">{videos.filter((v) => v.sensitivity?.status === "pending").length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Processing Jobs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Recent Jobs</span>
                <span className="font-medium">{stats?.recentJobs?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>In Progress</span>
                <span className="font-medium">{stats?.processingVideos || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Completed</span>
                <span className="font-medium">{stats?.readyVideos || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Tables */}
        <Tabs defaultValue="videos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            <Card>
              <CardHeader>
                <CardTitle>Video Management</CardTitle>
                <CardDescription>Manage all uploaded videos and their sensitivity status</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sensitivity</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {videos.map((video) => (
                      <TableRow key={video._id}>
                        <TableCell className="font-medium">{video.title}</TableCell>
                        <TableCell>{video.userId}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              video.status === "ready"
                                ? "default"
                                : video.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {video.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={video.sensitivity?.status || "pending"}
                            onValueChange={(value) => updateVideoSensitivity(video._id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="safe">Safe</SelectItem>
                              <SelectItem value="flagged">Flagged</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{video.views || 0}</TableCell>
                        <TableCell>{formatBytes(video.size)}</TableCell>
                        <TableCell className="text-sm">{formatDate(video.createdAt)}</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => deleteVideo(video._id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          <Select value={user.role} onValueChange={(value) => updateUserRole(user.id, value)}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{user.tenant}</TableCell>
                        <TableCell className="text-sm">{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" disabled>
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
