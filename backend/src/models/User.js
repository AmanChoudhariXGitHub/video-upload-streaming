// User model interface - using simulated MongoDB
export class User {
  static async findOne(query) {
    const { db } = await import("../config/db.js")
    return db.findOne("users", query)
  }

  static async findById(id) {
    const { db } = await import("../config/db.js")
    return db.findById("users", id)
  }

  static async create(data) {
    const { db } = await import("../config/db.js")
    return db.insert("users", data)
  }

  static async find(query = {}) {
    const { db } = await import("../config/db.js")
    return db.find("users", query)
  }

  static async updateById(id, update) {
    const { db } = await import("../config/db.js")
    return db.updateById("users", id, update)
  }

  static async deleteById(id) {
    const { db } = await import("../config/db.js")
    return db.deleteById("users", id)
  }
}

export const userSchema = {
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "editor", "viewer"], default: "viewer" },
  tenant: { type: String, required: true, default: "default" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}
