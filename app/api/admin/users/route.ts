import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import db from "@/lib/db"

export async function GET() {
  try {
    await requireAdmin()

    const users = db.getAllUsers()

    const userList = users.map((user) => ({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      videoCount: db.getVideosByUserId(user._id).length,
    }))

    return NextResponse.json({ users: userList })
  } catch (error) {
    console.error("[v0] Admin get users error:", error)

    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
