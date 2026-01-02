import fs from "fs/promises"
import path from "path"
import { existsSync } from "fs"

const UPLOAD_DIR = path.join(process.cwd(), "uploads")
const PROCESSED_DIR = path.join(process.cwd(), "uploads", "processed")
const THUMBNAIL_DIR = path.join(process.cwd(), "uploads", "thumbnails")
const STREAM_DIR = path.join(process.cwd(), "uploads", "streams")

// Initialize directories
export async function initializeDirectories() {
  const dirs = [UPLOAD_DIR, PROCESSED_DIR, THUMBNAIL_DIR, STREAM_DIR]

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true })
    }
  }
}

export async function saveChunk(videoId: string, chunkIndex: number, buffer: Buffer): Promise<void> {
  await initializeDirectories()
  const chunkPath = path.join(UPLOAD_DIR, `${videoId}_chunk_${chunkIndex}`)
  await fs.writeFile(chunkPath, buffer)
}

export async function assembleChunks(videoId: string, totalChunks: number, filename: string): Promise<string> {
  await initializeDirectories()
  const finalPath = path.join(UPLOAD_DIR, `${videoId}_${filename}`)
  const writeStream = await fs.open(finalPath, "w")

  try {
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(UPLOAD_DIR, `${videoId}_chunk_${i}`)
      const chunkData = await fs.readFile(chunkPath)
      await writeStream.write(chunkData)

      // Delete chunk after assembling
      await fs.unlink(chunkPath)
    }
  } finally {
    await writeStream.close()
  }

  return finalPath
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    if (existsSync(filePath)) {
      await fs.unlink(filePath)
    }
  } catch (error) {
    console.error("[v0] Error deleting file:", error)
  }
}

export async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath)
  return stats.size
}

export function getUploadPath(filename: string): string {
  return path.join(UPLOAD_DIR, filename)
}

export function getProcessedPath(filename: string): string {
  return path.join(PROCESSED_DIR, filename)
}

export function getThumbnailPath(filename: string): string {
  return path.join(THUMBNAIL_DIR, filename)
}

export function getStreamPath(filename: string): string {
  return path.join(STREAM_DIR, filename)
}
