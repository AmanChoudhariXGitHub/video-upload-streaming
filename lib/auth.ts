import { cookies } from "next/headers"

const SESSION_COOKIE_NAME = "session"
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export interface User {
  id: string
  email: string
  username: string
  role: "admin" | "editor" | "viewer"
  created_at: string
}

async function fetchSupabase(table: string, options: RequestInit) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY || "",
      Authorization: `Bearer ${SUPABASE_KEY}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Supabase request failed")
  }

  return response.json()
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!userId) {
    return null
  }

  try {
    const data = await fetchSupabase("users", {
      method: "GET",
      body: JSON.stringify({ select: "id,email,username,role,created_at", id: `eq.${userId}` }),
    })

    if (Array.isArray(data) && data.length > 0) {
      return data[0] as User
    }
    return null
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
    const data = await fetchSupabase("users", {
      method: "GET",
    })

    if (!Array.isArray(data)) {
      return null
    }

    const user = data.find(
      (u: any) => u.email === email && u.password_hash === password,
    )

    if (!user) {
      console.error("[v0] User not found or password incorrect:", email)
      return null
    }

    const userData: User = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      created_at: user.created_at,
    }

    // Set cookie with user ID as session
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return { user: userData, sessionId: user.id }
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
    const existingUsers = await fetchSupabase("users", {
      method: "GET",
    })

    if (Array.isArray(existingUsers) && existingUsers.some((u: any) => u.email === email || u.username === username)) {
      console.error("[v0] User already exists")
      return null
    }

    // Create user with plain password (for demo purposes)
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY || "",
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        email,
        username,
        password_hash: password,
        role: "viewer",
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("[v0] Error creating user:", error)
      return null
    }

    const data = await response.json()
    const newUser = Array.isArray(data) ? data[0] : data

    const userData: User = {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
      created_at: newUser.created_at,
    }

    // Set cookie with user ID as session
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, newUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return { user: userData, sessionId: newUser.id }
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return null
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
