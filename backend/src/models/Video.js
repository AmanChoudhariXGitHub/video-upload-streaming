// Video model interface - using simulated MongoDB
export class Video {
  static async findOne(query) {
    const { db } = await import("../config/db.js")
    return db.findOne("videos", query)
  }

  static async findById(id) {
    const { db } = await import("../config/db.js")
    return db.findById("videos", id)
  }

  static async create(data) {
    const { db } = await import("../config/db.js")
    return db.insert("videos", data)
  }

  static async find(query = {}) {
    const { db } = await import("../config/db.js")
    return db.find("videos", query)
  }

  static async updateById(id, update) {
    const { db } = await import("../config/db.js")
    return db.updateById("videos", id, update)
  }

  static async deleteById(id) {
    const { db } = await import("../config/db.js")
    return db.deleteById("videos", id)
  }
}

export const videoSchema = {
  title: { type: String, required: true },
  description: { type: String },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  size: { type: Number, required: true },
  mimeType: { type: String, required: true },
  duration: { type: Number },
  userId: { type: String, required: true },
  tenant: { type: String, required: true },
  status: {
    type: String,
    enum: ["uploading", "processing", "ready", "failed", "flagged"],
    default: "uploading",
  },
  processingProgress: { type: Number, default: 0 },
  sensitivity: {
    status: { type: String, enum: ["pending", "safe", "flagged"], default: "pending" },
    confidence: { type: Number },
    reasons: [String],
  },
  formats: [
    {
      quality: String,
      format: String,
      path: String,
      size: Number,
    },
  ],
  thumbnail: { type: String },
  views: { type: Number, default: 0 },
  streamUrl: { type: String },
  manifestUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}
