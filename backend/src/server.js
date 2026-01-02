import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import cors from "cors"
import dotenv from "dotenv"
import { connectDB } from "./config/db.js"
import authRoutes from "./routes/auth.js"
import videoRoutes from "./routes/videos.js"
import adminRoutes from "./routes/admin.js"
import streamingRoutes from "./routes/streaming.js"
import analyticsRoutes from "./routes/analytics.js"
import { initializeStorage } from "./utils/fileStorage.js"
import { createVideoProcessor } from "./services/videoProcessor.js"

// Load environment variables
dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
})

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Make io accessible to routes
app.set("io", io)

// Initialize video processor
const videoProcessor = createVideoProcessor(io)
app.set("videoProcessor", videoProcessor)

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/videos", videoRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/stream", streamingRoutes)
app.use("/api/analytics", analyticsRoutes)

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// Socket.io connection
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`)

  socket.on("subscribe:video", (videoId) => {
    socket.join(`video:${videoId}`)
    console.log(`Client ${socket.id} subscribed to video ${videoId}`)
  })

  socket.on("unsubscribe:video", (videoId) => {
    socket.leave(`video:${videoId}`)
    console.log(`Client ${socket.id} unsubscribed from video ${videoId}`)
  })

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`)
  })
})

// Connect to database and start server
const PORT = process.env.PORT || 5000

Promise.all([connectDB(), initializeStorage()]).then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`)
    console.log("\nAPI Endpoints:")
    console.log("  POST   /api/auth/login")
    console.log("  POST   /api/auth/register")
    console.log("  POST   /api/videos/init")
    console.log("  POST   /api/videos/chunk")
    console.log("  POST   /api/videos/complete")
    console.log("  GET    /api/videos")
    console.log("  GET    /api/stream/:id/video")
    console.log("  GET    /api/stream/:id/video.m3u8")
    console.log("  GET    /api/stream/:id/manifest.mpd")
    console.log("  GET    /api/admin/stats")
  })
})

export { io }
