import { io, type Socket } from "socket.io-client"

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000"

class SocketClient {
  private socket: Socket | null = null

  connect() {
    if (this.socket?.connected) return this.socket

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    this.socket.on("connect", () => {
      console.log("[v0] Socket connected:", this.socket?.id)
    })

    this.socket.on("disconnect", () => {
      console.log("[v0] Socket disconnected")
    })

    this.socket.on("connect_error", (error) => {
      console.error("[v0] Socket connection error:", error)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket() {
    return this.socket
  }

  subscribeToVideo(videoId: string) {
    if (this.socket) {
      this.socket.emit("subscribe:video", videoId)
    }
  }

  unsubscribeFromVideo(videoId: string) {
    if (this.socket) {
      this.socket.emit("unsubscribe:video", videoId)
    }
  }

  onUploadProgress(callback: (data: any) => void) {
    this.socket?.on("upload:progress", callback)
  }

  onUploadComplete(callback: (data: any) => void) {
    this.socket?.on("upload:complete", callback)
  }

  onProcessingStarted(callback: (data: any) => void) {
    this.socket?.on("processing:started", callback)
  }

  onProcessingProgress(callback: (data: any) => void) {
    this.socket?.on("processing:progress", callback)
  }

  onProcessingStep(callback: (data: any) => void) {
    this.socket?.on("processing:step", callback)
  }

  onProcessingCompleted(callback: (data: any) => void) {
    this.socket?.on("processing:completed", callback)
  }

  onProcessingError(callback: (data: any) => void) {
    this.socket?.on("processing:error", callback)
  }

  off(event: string, callback?: any) {
    this.socket?.off(event, callback)
  }
}

export const socketClient = new SocketClient()
