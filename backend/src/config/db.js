// In-memory MongoDB simulation for development
class InMemoryDB {
  constructor() {
    this.collections = {
      users: [],
      videos: [],
      processingJobs: [],
    }
    this.counters = {
      users: 1,
      videos: 1,
      processingJobs: 1,
    }
    this.initialized = false
  }

  async connect() {
    if (this.initialized) return

    console.log("Initializing in-memory MongoDB simulation...")

    // Create default users
    this.collections.users = [
      {
        _id: "1",
        email: "admin@example.com",
        password: "$2a$10$rQ6K9Z7Z5Z5Z5Z5Z5Z5Z5uO5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z", // admin123
        role: "admin",
        tenant: "default",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "2",
        email: "editor@example.com",
        password: "$2a$10$rQ6K9Z7Z5Z5Z5Z5Z5Z5Z5uO5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z", // editor123
        role: "editor",
        tenant: "default",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "3",
        email: "viewer@example.com",
        password: "$2a$10$rQ6K9Z7Z5Z5Z5Z5Z5Z5Z5uO5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z", // viewer123
        role: "viewer",
        tenant: "default",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    this.counters.users = 4
    this.initialized = true

    console.log("In-memory DB initialized with sample data")
    console.log("Demo accounts:")
    console.log("  Admin: admin@example.com / admin123")
    console.log("  Editor: editor@example.com / editor123")
    console.log("  Viewer: viewer@example.com / viewer123")
  }

  getCollection(name) {
    return this.collections[name] || []
  }

  find(collection, query = {}) {
    const data = this.collections[collection] || []
    if (Object.keys(query).length === 0) return data

    return data.filter((item) => {
      return Object.keys(query).every((key) => {
        if (typeof query[key] === "object" && query[key].$ne !== undefined) {
          return item[key] !== query[key].$ne
        }
        return item[key] === query[key]
      })
    })
  }

  findOne(collection, query) {
    const results = this.find(collection, query)
    return results[0] || null
  }

  findById(collection, id) {
    return this.findOne(collection, { _id: id.toString() })
  }

  insert(collection, data) {
    const id = this.counters[collection]++
    const newItem = {
      _id: id.toString(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.collections[collection].push(newItem)
    return newItem
  }

  update(collection, query, update) {
    const items = this.find(collection, query)
    items.forEach((item) => {
      Object.assign(item, update, { updatedAt: new Date() })
    })
    return items.length
  }

  updateById(collection, id, update) {
    const item = this.findById(collection, id)
    if (item) {
      Object.assign(item, update, { updatedAt: new Date() })
      return item
    }
    return null
  }

  delete(collection, query) {
    const data = this.collections[collection]
    const itemsToDelete = this.find(collection, query)
    this.collections[collection] = data.filter((item) => !itemsToDelete.includes(item))
    return itemsToDelete.length
  }

  deleteById(collection, id) {
    return this.delete(collection, { _id: id.toString() })
  }
}

// Export singleton instance
export const db = new InMemoryDB()

export async function connectDB() {
  try {
    await db.connect()
    console.log("Database connected successfully")
  } catch (error) {
    console.error("Database connection failed:", error)
    process.exit(1)
  }
}
