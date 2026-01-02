const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

class APIClient {
  private token: string | null = null

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem("auth_token", token)
    } else {
      localStorage.removeItem("auth_token")
    }
  }

  getToken() {
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
    return this.token
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken()

    const headers: HeadersInit = {
      ...options.headers,
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json"
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }))
      throw new Error(error.error || "Request failed")
    }

    return response.json()
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    this.setToken(data.token)
    return data
  }

  async register(email: string, password: string, role?: string) {
    const data = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    })
    this.setToken(data.token)
    return data
  }

  logout() {
    this.setToken(null)
  }

  // Videos
  async initUpload(filename: string, filesize: number, mimetype: string, title?: string, description?: string) {
    return this.request("/videos/init", {
      method: "POST",
      body: JSON.stringify({ filename, filesize, mimetype, title, description }),
    })
  }

  async uploadChunk(videoId: string, chunkIndex: number, totalChunks: number, chunk: Blob) {
    const formData = new FormData()
    formData.append("videoId", videoId)
    formData.append("chunkIndex", chunkIndex.toString())
    formData.append("totalChunks", totalChunks.toString())
    formData.append("chunk", chunk)

    const token = this.getToken()
    const response = await fetch(`${API_URL}/videos/chunk`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Chunk upload failed" }))
      throw new Error(error.error || "Chunk upload failed")
    }

    return response.json()
  }

  async completeUpload(videoId: string, totalChunks: number) {
    return this.request("/videos/complete", {
      method: "POST",
      body: JSON.stringify({ videoId, totalChunks }),
    })
  }

  async getVideos() {
    return this.request("/videos")
  }

  async getVideo(id: string) {
    return this.request(`/videos/${id}`)
  }

  async updateVideo(id: string, updates: { title?: string; description?: string }) {
    return this.request(`/videos/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  }

  async deleteVideo(id: string) {
    return this.request(`/videos/${id}`, {
      method: "DELETE",
    })
  }

  // Streaming
  getStreamUrl(videoId: string) {
    const token = this.getToken()
    return `${API_URL}/stream/${videoId}/video${token ? `?token=${token}` : ""}`
  }

  getThumbnailUrl(videoId: string) {
    const token = this.getToken()
    return `${API_URL}/stream/${videoId}/thumbnail${token ? `?token=${token}` : ""}`
  }

  // Admin
  async getAdminStats() {
    return this.request("/admin/stats")
  }

  async getUsers() {
    return this.request("/admin/users")
  }

  async updateUserRole(userId: string, role: string) {
    return this.request(`/admin/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    })
  }

  async updateVideoSensitivity(videoId: string, status: string) {
    return this.request(`/admin/videos/${videoId}/sensitivity`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    })
  }

  async getProcessingJobs() {
    return this.request("/admin/jobs")
  }

  // Analytics
  async trackView(videoId: string, watchTime?: number, quality?: string) {
    return this.request("/analytics/track/view", {
      method: "POST",
      body: JSON.stringify({ videoId, watchTime, quality }),
    })
  }

  async getVideoAnalytics(videoId: string) {
    return this.request(`/analytics/video/${videoId}`)
  }

  async getPlatformAnalytics() {
    return this.request("/analytics/platform")
  }
}

export const apiClient = new APIClient()
