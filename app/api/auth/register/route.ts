import { type NextRequest, NextResponse } from "next/server"
import { register } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json()

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Username, email, and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const result = await register(username, email, password)

    if (!result) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: result.user._id,
        username: result.user.username,
        email: result.user.email,
        role: result.user.role,
      },
    })
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
