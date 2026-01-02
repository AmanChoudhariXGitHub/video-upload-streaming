import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const STORAGE_ROOT = path.join(__dirname, "../../storage")
const UPLOADS_DIR = path.join(STORAGE_ROOT, "uploads")
const TEMP_DIR = path.join(STORAGE_ROOT, "temp")
const PROCESSED_DIR = path.join(STORAGE_ROOT, "processed")
const THUMBNAILS_DIR = path.join(STORAGE_ROOT, "thumbnails")

// Initialize storage directories
export async function initializeStorage() {
  const dirs = [STORAGE_ROOT, UPLOADS_DIR, TEMP_DIR, PROCESSED_DIR, THUMBNAILS_DIR]

  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true })
    } catch (error) {
      console.error(`Failed to create directory ${dir}:`, error)
    }
  }

  console.log("Storage directories initialized")
}

export async function saveChunk(videoId, chunkIndex, buffer) {
  const chunkDir = path.join(TEMP_DIR, videoId)
  await fs.mkdir(chunkDir, { recursive: true })

  const chunkPath = path.join(chunkDir, `chunk-${chunkIndex}`)
  await fs.writeFile(chunkPath, buffer)

  return chunkPath
}

export async function assembleChunks(videoId, totalChunks, filename) {
  const chunkDir = path.join(TEMP_DIR, videoId)
  const outputPath = path.join(UPLOADS_DIR, filename)

  const writeStream = (await import("fs")).createWriteStream(outputPath)

  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = path.join(chunkDir, `chunk-${i}`)
    const chunkBuffer = await fs.readFile(chunkPath)
    writeStream.write(chunkBuffer)
  }

  writeStream.end()

  // Wait for stream to finish
  await new Promise((resolve, reject) => {
    writeStream.on("finish", resolve)
    writeStream.on("error", reject)
  })

  // Clean up chunks
  await fs.rm(chunkDir, { recursive: true, force: true })

  return outputPath
}

export async function getFilePath(filename, type = "uploads") {
  const dirs = {
    uploads: UPLOADS_DIR,
    processed: PROCESSED_DIR,
    thumbnails: THUMBNAILS_DIR,
  }

  return path.join(dirs[type] || UPLOADS_DIR, filename)
}

export async function deleteFile(filepath) {
  try {
    await fs.unlink(filepath)
    return true
  } catch (error) {
    console.error("Failed to delete file:", error)
    return false
  }
}

export async function getFileStats(filepath) {
  try {
    const stats = await fs.stat(filepath)
    return stats
  } catch (error) {
    return null
  }
}

export async function createReadStream(filepath) {
  const fs = await import("fs")
  return fs.createReadStream(filepath)
}

export { UPLOADS_DIR, TEMP_DIR, PROCESSED_DIR, THUMBNAILS_DIR }
