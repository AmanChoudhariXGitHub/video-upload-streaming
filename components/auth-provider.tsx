"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"

interface User {
  id: string
  email: string
  role: "admin" | "editor" | "viewer"
  tenant: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = apiClient.getToken()
      if (token) {
        // Token exists, assume user is logged in
        // In a real app, you might want to validate the token with the backend
        const decodedUser = JSON.parse(atob(token.split(".")[1]))
        setUser({
          id: decodedUser.id,
          email: decodedUser.email,
          role: decodedUser.role,
          tenant: decodedUser.tenant,
        })
      }
    } catch (error) {
      console.error("[v0] Auth check error:", error)
      apiClient.setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const data = await apiClient.login(email, password)
      setUser(data.user)
      return true
    } catch (error) {
      console.error("[v0] Login error:", error)
      return false
    }
  }

  const register = async (email: string, password: string): Promise<boolean> => {
    try {
      const data = await apiClient.register(email, password)
      setUser(data.user)
      return true
    } catch (error) {
      console.error("[v0] Registration error:", error)
      return false
    }
  }

  const logout = async () => {
    try {
      apiClient.logout()
      setUser(null)
      router.push("/login")
    } catch (error) {
      console.error("[v0] Logout error:", error)
    }
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
