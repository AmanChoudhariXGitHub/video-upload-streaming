import { cookies } from "next/headers"
import db, { type User } from "./db"

const SESSION_COOKIE_NAME = "session"

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionId) {
    return null
  }

  const session = db.getSession(sessionId)
  if (!session) {
    return null
  }

  const user = db.getUserById(session.userId)
  return user || null
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
  const user = db.getUserByEmail(email)

  if (!user || user.password !== password) {
    return null
  }

  const sessionId = db.createSession(user._id)

  // Set cookie
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  })

  return { user, sessionId }
}

export async function register(
  username: string,
  email: string,
  password: string,
): Promise<{ user: User; sessionId: string } | null> {
  // Check if user already exists
  if (db.getUserByEmail(email) || db.getUserByUsername(username)) {
    return null
  }

  const user = db.createUser({
    username,
    email,
    password,
    role: "user",
  })

  const sessionId = db.createSession(user._id)

  // Set cookie
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  })

  return { user, sessionId }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (sessionId) {
    db.deleteSession(sessionId)
  }

  cookieStore.delete(SESSION_COOKIE_NAME)
}
