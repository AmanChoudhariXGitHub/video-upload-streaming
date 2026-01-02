// Simulated MongoDB with in-memory storage

export interface User {
  _id: string
  username: string
  email: string
  password: string // In production, this would be hashed
  role: "user" | "admin"
  createdAt: Date
  updatedAt: Date
}

export interface Video {
  _id: string
  userId: string
  title: string
  description: string
  filename: string
  originalPath: string
  processedPath?: string
  thumbnailPath?: string
  hlsPath?: string
  dashPath?: string
  status: "uploading" | "processing" | "ready" | "failed"
  sensitivityStatus: "pending" | "safe" | "flagged"
  sensitivityScore?: number
  duration?: number
  size: number
  format: string
  resolution?: string
  createdAt: Date
  updatedAt: Date
  views: number
}

export interface ProcessingJob {
  _id: string
  videoId: string
  type: "transcode" | "thumbnail" | "analysis" | "hls" | "dash"
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  error?: string
  createdAt: Date
  updatedAt: Date
}

export interface AnalyticsEvent {
  _id: string
  videoId: string
  userId?: string
  event: "view" | "play" | "pause" | "complete" | "buffer"
  timestamp: Date
  metadata?: Record<string, any>
}

// In-memory database
class Database {
  private users: Map<string, User> = new Map()
  private videos: Map<string, Video> = new Map()
  private jobs: Map<string, ProcessingJob> = new Map()
  private analytics: AnalyticsEvent[] = []
  private sessions: Map<string, { userId: string; expiresAt: Date }> = new Map()

  constructor() {
    // Create default admin user
    this.users.set("admin", {
      _id: "admin",
      username: "admin",
      email: "admin@example.com",
      password: "admin123", // In production, use bcrypt
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Create default regular user
    this.users.set("user1", {
      _id: "user1",
      username: "testuser",
      email: "user@example.com",
      password: "user123",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  // User methods
  createUser(user: Omit<User, "_id" | "createdAt" | "updatedAt">): User {
    const id = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const newUser: User = {
      ...user,
      _id: id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.users.set(id, newUser)
    return newUser
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id)
  }

  getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find((u) => u.email === email)
  }

  getUserByUsername(username: string): User | undefined {
    return Array.from(this.users.values()).find((u) => u.username === username)
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values())
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(id)
    if (!user) return undefined

    const updatedUser = { ...user, ...updates, updatedAt: new Date() }
    this.users.set(id, updatedUser)
    return updatedUser
  }

  deleteUser(id: string): boolean {
    return this.users.delete(id)
  }

  // Video methods
  createVideo(video: Omit<Video, "_id" | "createdAt" | "updatedAt" | "views">): Video {
    const id = `video_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const newVideo: Video = {
      ...video,
      _id: id,
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
    }
    this.videos.set(id, newVideo)
    return newVideo
  }

  getVideoById(id: string): Video | undefined {
    return this.videos.get(id)
  }

  getVideosByUserId(userId: string): Video[] {
    return Array.from(this.videos.values()).filter((v) => v.userId === userId)
  }

  getAllVideos(): Video[] {
    return Array.from(this.videos.values())
  }

  updateVideo(id: string, updates: Partial<Video>): Video | undefined {
    const video = this.videos.get(id)
    if (!video) return undefined

    const updatedVideo = { ...video, ...updates, updatedAt: new Date() }
    this.videos.set(id, updatedVideo)
    return updatedVideo
  }

  deleteVideo(id: string): boolean {
    return this.videos.delete(id)
  }

  // Job methods
  createJob(job: Omit<ProcessingJob, "_id" | "createdAt" | "updatedAt">): ProcessingJob {
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const newJob: ProcessingJob = {
      ...job,
      _id: id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.jobs.set(id, newJob)
    return newJob
  }

  getJobById(id: string): ProcessingJob | undefined {
    return this.jobs.get(id)
  }

  getJobsByVideoId(videoId: string): ProcessingJob[] {
    return Array.from(this.jobs.values()).filter((j) => j.videoId === videoId)
  }

  getAllJobs(): ProcessingJob[] {
    return Array.from(this.jobs.values())
  }

  updateJob(id: string, updates: Partial<ProcessingJob>): ProcessingJob | undefined {
    const job = this.jobs.get(id)
    if (!job) return undefined

    const updatedJob = { ...job, ...updates, updatedAt: new Date() }
    this.jobs.set(id, updatedJob)
    return updatedJob
  }

  // Analytics methods
  createAnalyticsEvent(event: Omit<AnalyticsEvent, "_id" | "timestamp">): AnalyticsEvent {
    const id = `event_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const newEvent: AnalyticsEvent = {
      ...event,
      _id: id,
      timestamp: new Date(),
    }
    this.analytics.push(newEvent)
    return newEvent
  }

  getAnalyticsByVideoId(videoId: string): AnalyticsEvent[] {
    return this.analytics.filter((e) => e.videoId === videoId)
  }

  // Session methods
  createSession(userId: string): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    this.sessions.set(sessionId, { userId, expiresAt })
    return sessionId
  }

  getSession(sessionId: string): { userId: string; expiresAt: Date } | undefined {
    const session = this.sessions.get(sessionId)
    if (!session) return undefined

    // Check if expired
    if (session.expiresAt < new Date()) {
      this.sessions.delete(sessionId)
      return undefined
    }

    return session
  }

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId)
  }
}

// Singleton instance
const db = new Database()

export default db
