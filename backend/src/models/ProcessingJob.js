// ProcessingJob model interface - using simulated MongoDB
export class ProcessingJob {
  static async findOne(query) {
    const { db } = await import("../config/db.js")
    return db.findOne("processingJobs", query)
  }

  static async findById(id) {
    const { db } = await import("../config/db.js")
    return db.findById("processingJobs", id)
  }

  static async create(data) {
    const { db } = await import("../config/db.js")
    return db.insert("processingJobs", data)
  }

  static async find(query = {}) {
    const { db } = await import("../config/db.js")
    return db.find("processingJobs", query)
  }

  static async updateById(id, update) {
    const { db } = await import("../config/db.js")
    return db.updateById("processingJobs", id, update)
  }

  static async deleteById(id) {
    const { db } = await import("../config/db.js")
    return db.deleteById("processingJobs", id)
  }
}

export const processingJobSchema = {
  videoId: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending",
  },
  progress: { type: Number, default: 0 },
  currentStep: { type: String },
  steps: [
    {
      name: String,
      status: String,
      progress: Number,
      startedAt: Date,
      completedAt: Date,
      error: String,
    },
  ],
  error: { type: String },
  startedAt: { type: Date },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}
