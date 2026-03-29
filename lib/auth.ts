import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const SESSION_COOKIE_NAME = "session"

export interface User {
  id: string
  email: string
  username: string
  role: "admin" | "editor" | "viewer"
  created_at: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
)

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!userId) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, username, role, created_at")
      .eq("id", userId)
      .single()

    if (error || !data) {
      return null
    }

    return data as User
  } catch (error) {
    console.error("[v0] Error getting current user:", error)
    return null
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth()
  if (user.role !== "admin") {
    throw new Error("Forbidden: Admin access required")
  }
  return user
}

export async function login(email: string, password: string): Promise<{ user: User; sessionId: string } | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, username, role, password_hash, created_at")
      .eq("email", email)
      .single()

    if (error || !data) {
      console.error("[v0] User not found:", email)
      return null
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, data.password_hash)

    if (!passwordMatch) {
      console.error("[v0] Password mismatch for user:", email)
      return null
    }

    const user: User = {
      id: data.id,
      email: data.email,
      username: data.username,
      role: data.role,
      created_at: data.created_at,
    }

    // Set cookie with user ID as session
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, data.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return { user, sessionId: data.id }
  } catch (error) {
    console.error("[v0] Login error:", error)
    return null
  }
}

export async function register(
  username: string,
  email: string,
  password: string,
): Promise<{ user: User; sessionId: string } | null> {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .or(`email.eq.${email},username.eq.${username}`)
      .single()

    if (existingUser) {
      console.error("[v0] User already exists")
      return null
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const { data, error } = await supabase
      .from("users")
      .insert({
        email,
        username,
        password_hash: passwordHash,
        role: "viewer",
      })
      .select("id, email, username, role, created_at")
      .single()

    if (error || !data) {
      console.error("[v0] Error creating user:", error)
      return null
    }

    const user: User = {
      id: data.id,
      email: data.email,
      username: data.username,
      role: data.role,
      created_at: data.created_at,
    }

    // Set cookie with user ID as session
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, data.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return { user, sessionId: data.id }
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return null
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
